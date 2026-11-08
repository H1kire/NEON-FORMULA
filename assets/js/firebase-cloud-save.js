// FORMULA ASCENT — per-account cloud snapshot for the complete game state
(() => {
  "use strict";

  const GAME_KEY = "formula_ascent_save_v2";
  const PRESTIGE_KEY = "prestigeSave";
  const META_KEY = "faMeta";
  const TREE_KEY = "faTree";
  const LEGACY_KEYS = ["formula_ascent_save_v1", "neon_formula_idle_v4_5"];
  const SNAPSHOT_KEYS = [GAME_KEY, PRESTIGE_KEY, META_KEY, TREE_KEY];
  const $ = id => document.getElementById(id);
  const saveButton = $("cloudSaveBtn");
  const restoreButton = $("cloudRestoreBtn");
  const status = $("cloudSaveStatus");

  const words = {
    en: {
      checking: "Checking cloud save…",
      noSave: "No cloud save exists for this Google account yet.",
      ready: "Cloud save found. Last saved: ",
      saved: "Complete game progress saved to the cloud.",
      restored: "Cloud progress restored. Reloading the game…",
      saving: "Saving complete game progress…",
      restoring: "Downloading and validating cloud progress…",
      signedOut: "Sign in with Google to use cloud saves.",
      saveError: "Could not save progress to the cloud. Check your connection and Firebase Database Rules.",
      restoreError: "Could not restore progress. The cloud snapshot may be missing, damaged, or inaccessible.",
      invalid: "The cloud snapshot is incomplete or invalid. Local progress was not changed.",
      confirm: "Restore the cloud save? This will replace ALL current progress on this device with the saved snapshot.",
      dateUnknown: "date unavailable"
    },
    ru: {
      checking: "Проверяем облачное сохранение…",
      noSave: "В этом Google-аккаунте пока нет облачного сохранения.",
      ready: "Облачное сохранение найдено. Последняя запись: ",
      saved: "Полный прогресс игры сохранён в облаке.",
      restored: "Облачный прогресс восстановлен. Перезагружаем игру…",
      saving: "Сохраняем полный прогресс игры…",
      restoring: "Загружаем и проверяем облачный прогресс…",
      signedOut: "Войдите через Google, чтобы использовать облачные сохранения.",
      saveError: "Не удалось сохранить прогресс в облако. Проверьте подключение и правила Firebase Database.",
      restoreError: "Не удалось восстановить прогресс. Облачное сохранение отсутствует, повреждено или недоступно.",
      invalid: "Облачное сохранение неполное или повреждено. Локальный прогресс не изменён.",
      confirm: "Восстановить облачное сохранение? ВЕСЬ текущий прогресс на этом устройстве будет заменён сохранённым снимком.",
      dateUnknown: "дата неизвестна"
    }
  };

  const lang = () => document.documentElement.lang === "ru" ? "ru" : "en";
  const msg = key => words[lang()][key] || words.en[key] || key;
  let user = null;
  let database = null;
  let busy = false;
  let hasCloudSave = false;
  let authGeneration = 0;

  function showStatus(value, state) {
    if (!status) return;
    status.textContent = value || "";
    status.dataset.state = state || "";
    status.hidden = !value;
  }

  function render() {
    const signedIn = !!user;
    if (saveButton) {
      saveButton.hidden = !signedIn;
      saveButton.disabled = !signedIn || busy;
    }
    if (restoreButton) {
      restoreButton.hidden = !signedIn;
      restoreButton.disabled = !signedIn || busy || !hasCloudSave;
    }
  }

  function parseSnapshotData(data) {
    if (!data || typeof data !== "object") throw new Error("Missing snapshot data");
    for (const key of SNAPSHOT_KEYS) {
      if (typeof data[key] !== "string") throw new Error("Missing snapshot key: " + key);
    }
    const parse = key => JSON.parse(data[key]);
    const game = parse(GAME_KEY);
    const prestige = parse(PRESTIGE_KEY);
    const meta = parse(META_KEY);
    const tree = parse(TREE_KEY);
    const finiteNonNegative = value => Number.isFinite(Number(value)) && Number(value) >= 0;
    if (!game || typeof game !== "object" || Array.isArray(game) ||
        !["t", "value", "aLevel", "bLevel", "cLevel", "dLevel", "eLevel", "formulaSteps", "formulaAccumulator", "lastTime"].every(key => finiteNonNegative(game[key])) || (game.fLevel !== undefined && !finiteNonNegative(game.fLevel)) ||
        !game.formulaState || typeof game.formulaState !== "object" ||
        !["a", "b", "c", "d", "e"].every(key => Number.isFinite(Number(game.formulaState[key])) && Number(game.formulaState[key]) >= 1)) {
      throw new Error("Invalid game state");
    }
    if (!prestige || typeof prestige !== "object" || Array.isArray(prestige) ||
        !finiteNonNegative(prestige.p) || !finiteNonNegative(prestige.gp) ||
        !prestige.prestigeUpgrades || typeof prestige.prestigeUpgrades !== "object" ||
        !Number.isInteger(prestige.prestigeUpgrades.simpleBoost) || prestige.prestigeUpgrades.simpleBoost < 0 ||
        !Number.isInteger(prestige.prestigeUpgrades.globalSum) || prestige.prestigeUpgrades.globalSum < 0) {
      throw new Error("Invalid prestige state");
    }
    if (!meta || typeof meta !== "object" || Array.isArray(meta) ||
        !Array.isArray(meta.research) || meta.research.length !== 10 ||
        !meta.research.every(value => Number.isInteger(value) && value >= 0) ||
        !meta.settings || typeof meta.settings !== "object" || Array.isArray(meta.settings) ||
        !meta.automation || typeof meta.automation !== "object" || Array.isArray(meta.automation) ||
        !Array.isArray(meta.automation.unlocked) || meta.automation.unlocked.length !== 5 ||
        !meta.automation.unlocked.every(value => typeof value === "boolean") ||
        !Array.isArray(meta.automation.enabled) || meta.automation.enabled.length !== 5 ||
        !meta.automation.enabled.every(value => typeof value === "boolean") ||
        typeof meta.automation.paused !== "boolean" ||
        !meta.stats || typeof meta.stats !== "object" || Array.isArray(meta.stats) ||
        !["totalPlayTime", "lifetimeValue", "ascensions", "genesisPrestiges", "purchases"].every(key => finiteNonNegative(meta.stats[key])) ||
        (meta.treeUnlocked !== undefined && typeof meta.treeUnlocked !== "boolean") ||
        (meta.treePassPurchased !== undefined && typeof meta.treePassPurchased !== "boolean")) {
      throw new Error("Invalid meta state");
    }
    if (!Array.isArray(tree) || tree.some(node => !node || !Number.isInteger(node.id) || node.id < 0 || node.id >= 3886 ||
        !Number.isInteger(node.level) || node.level < 1) ||
        new Set(tree.map(node => node.id)).size !== tree.length) {
      throw new Error("Invalid upgrade tree state");
    }
    return { game, prestige, meta, tree };
  }

  function mergeLocalPreferences(cloudMeta) {
    const localMeta = window.FAStorage.getJSON(META_KEY, null) || window.FA_META || {};
    if (localMeta.language === "ru" || localMeta.language === "en") cloudMeta.language = localMeta.language;
    if (["standard", "scientific", "engineering"].includes(localMeta.notation)) cloudMeta.notation = localMeta.notation;
    if (localMeta.settings && typeof localMeta.settings === "object" && !Array.isArray(localMeta.settings)) {
      cloudMeta.settings = Object.assign({}, cloudMeta.settings, localMeta.settings);
    }
    return cloudMeta;
  }

  function collectLocalSnapshot() {
    const results = [
      typeof window.saveGame === "function" && window.saveGame(true),
      typeof window.saveMeta === "function" && window.saveMeta(),
      typeof window.savePrestige === "function" && window.savePrestige(),
      typeof window.saveTreeProgress === "function" && window.saveTreeProgress()
    ];
    if (results.some(result => result !== true)) throw new Error("Could not flush every local save section");
    const data = {};
    for (const key of SNAPSHOT_KEYS) {
      const raw = window.FAStorage.getRaw(key, null);
      if (typeof raw !== "string") throw new Error("Missing local save section: " + key);
      data[key] = raw;
    }
    parseSnapshotData(data);
    return data;
  }

  function saveReference() {
    if (!user || !database) throw new Error("No authenticated Firebase session");
    return database.ref("users/" + user.uid + "/cloudSave");
  }

  async function checkCloudSave() {
    if (!user || !database) return;
    const checkedUser = user;
    const generation = authGeneration;
    showStatus(msg("checking"));
    try {
      const snapshot = await database.ref("users/" + checkedUser.uid + "/cloudSave").once("value");
      if (generation !== authGeneration || !user || user.uid !== checkedUser.uid) return;
      const record = snapshot.val();
      hasCloudSave = false;
      if (record && record.version === 1 && record.uid === checkedUser.uid && record.data) {
        parseSnapshotData(record.data);
        hasCloudSave = true;
        const date = Number(record.savedAt);
        const formatted = Number.isFinite(date) ? new Date(date).toLocaleString(lang() === "ru" ? "ru-RU" : "en-US") : msg("dateUnknown");
        showStatus(msg("ready") + formatted, "success");
      } else {
        showStatus(msg("noSave"));
      }
    } catch (error) {
      if (generation !== authGeneration) return;
      hasCloudSave = false;
      const invalid = /snapshot|progress sections|state|Missing snapshot/i.test(String(error && error.message));
      showStatus(invalid ? msg("invalid") : msg("restoreError"), "error");
    }
    render();
  }

  async function saveToCloud() {
    if (!user || busy) return;
    busy = true;
    showStatus(msg("saving"));
    render();
    try {
      const savingUser = user;
      const data = collectLocalSnapshot();
      await database.ref("users/" + savingUser.uid + "/cloudSave").set({
        version: 1,
        uid: savingUser.uid,
        savedAt: firebase.database.ServerValue.TIMESTAMP,
        data
      });
      if (user && user.uid === savingUser.uid) {
        hasCloudSave = true;
        showStatus(msg("saved") + " " + new Date().toLocaleString(lang() === "ru" ? "ru-RU" : "en-US"), "success");
      }
    } catch (error) {
      console.error("[FACloudSave] Save failed", error);
      showStatus(msg("saveError"), "error");
    } finally {
      busy = false;
      render();
    }
  }

  async function restoreFromCloud() {
    if (!user || busy || !hasCloudSave) return;
    if (!window.confirm(msg("confirm"))) return;
    busy = true;
    showStatus(msg("restoring"));
    render();
    let previous = null;
    try {
      const restoringUser = user;
      const snapshot = await database.ref("users/" + restoringUser.uid + "/cloudSave").once("value");
      const record = snapshot.val();
      if (!user || user.uid !== restoringUser.uid) throw new Error("Account changed during restore");
      if (!record || record.version !== 1 || record.uid !== restoringUser.uid) throw new Error("Snapshot owner/version mismatch");
      const parsed = parseSnapshotData(record.data);
      const data = Object.assign({}, record.data);

      // Cloud restores replace game progression, while device-specific UI preferences stay local.
      mergeLocalPreferences(parsed.meta);
      data[META_KEY] = JSON.stringify(parsed.meta);

      // Restoring must reproduce the saved moment, not award offline production accumulated since it.
      parsed.game.lastTime = Date.now();
      data[GAME_KEY] = JSON.stringify(parsed.game);

      const keysToReplace = SNAPSHOT_KEYS.concat(LEGACY_KEYS);
      previous = {};
      for (const key of keysToReplace) previous[key] = window.FAStorage.getRaw(key, null);
      for (const key of SNAPSHOT_KEYS) {
        if (!window.FAStorage.setRaw(key, data[key])) throw new Error("Could not write local save section: " + key);
      }
      for (const key of LEGACY_KEYS) {
        if (!window.FAStorage.remove(key)) throw new Error("Could not remove legacy save section: " + key);
      }
      showStatus(msg("restored"), "success");
      window.location.reload();
    } catch (error) {
      console.error("[FACloudSave] Restore failed", error);
      if (previous) {
        try {
          for (const key of Object.keys(previous)) {
            if (previous[key] === null) window.FAStorage.remove(key);
            else window.FAStorage.setRaw(key, previous[key]);
          }
        } catch (rollbackError) {
          console.error("[FACloudSave] Local rollback failed", rollbackError);
        }
      }
      const invalid = /snapshot|progress sections|game state|Missing snapshot/i.test(String(error && error.message));
      showStatus(invalid ? msg("invalid") : msg("restoreError"), "error");
    } finally {
      busy = false;
      render();
    }
  }

  if (saveButton) saveButton.addEventListener("click", saveToCloud);
  if (restoreButton) restoreButton.addEventListener("click", restoreFromCloud);

  try {
    if (!window.firebase || !firebase.apps.length || !firebase.database) throw new Error("Firebase Database SDK is unavailable");
    const app = firebase.app();
    database = firebase.database(app);
    firebase.auth(app).onAuthStateChanged(nextUser => {
      authGeneration++;
      user = nextUser || null;
      hasCloudSave = false;
      if (!user) showStatus(msg("signedOut"));
      render();
      if (user) checkCloudSave();
    }, error => {
      user = null;
      hasCloudSave = false;
      showStatus(msg("restoreError"), "error");
      render();
      console.error("[FACloudSave] Auth state error", error);
    });
  } catch (error) {
    showStatus(msg("saveError"), "error");
    if (saveButton) saveButton.disabled = true;
    if (restoreButton) restoreButton.disabled = true;
    console.error("[FACloudSave] Initialization failed", error);
  }

  render();
})();
