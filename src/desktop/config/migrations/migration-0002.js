// @flow
function migrateSpellcheckTrue(oldConfig: any) {
	return Object.assign(oldConfig, {"desktopConfigVersion": 2, "spellcheck": true})
}

function migrateSpellcheckFalse(oldConfig: any) {
	return Object.assign(oldConfig, {"desktopConfigVersion": 2, "spellcheck": false})
}

export const migrateClient = migrateSpellcheckTrue
export const migrateAdmin = migrateSpellcheckFalse