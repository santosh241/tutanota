// @flow

import type {ContextMenuParams, WebContents} from "electron"
import {BrowserWindow, clipboard, Menu, MenuItem} from 'electron'
import {lang} from "../misc/LanguageViewModel"
import type {IPC} from "./IPC"

export class DesktopContextMenu {
	_ipc: IPC;

	constructor(ipc: IPC) {
		this._ipc = ipc
	}

	open(params: ContextMenuParams) {
		const {linkURL, editFlags, misspelledWord, dictionarySuggestions} = params
		const menu = new Menu()
		const pasteItem = new MenuItem({
			label: lang.get("paste_action"),
			accelerator: "CmdOrCtrl+V",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.paste(),
			enabled: editFlags.canPaste
		})
		const copyItem = new MenuItem({
			label: lang.get("copy_action"),
			accelerator: "CmdOrCtrl+C",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.copy(),
			enabled: editFlags.canCopy
		})
		const cutItem = new MenuItem({
			label: lang.get("cut_action"),
			accelerator: "CmdOrCtrl+X",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.cut(),
			enabled: editFlags.canCut
		})
		const copyLinkItem = new MenuItem({
			label: lang.get("copyLink_action"),
			click: () => !!linkURL && clipboard.writeText(linkURL),
			enabled: !!linkURL
		})
		const undoItem = new MenuItem({
			label: lang.get("undo_action"),
			accelerator: "CmdOrCtrl+Z",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.undo(),
			enabled: editFlags.canUndo
		})
		const redoItem = new MenuItem({
			label: lang.get("redo_action"),
			accelerator: "CmdOrCtrl+Shift+Z",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.redo(),
			enabled: editFlags.canRedo
		})
		const spellingItem = new MenuItem({
			label: lang.get("spelling_label"),
			submenu: this._spellingSubmenu(misspelledWord, dictionarySuggestions)
		})

		menu.append(copyItem)
		menu.append(cutItem)
		menu.append(copyLinkItem)
		menu.append(pasteItem)
		menu.append(new MenuItem({type: 'separator'}))
		menu.append(undoItem)
		menu.append(redoItem)
		menu.append(new MenuItem({type: 'separator'}))
		menu.append(spellingItem)
		menu.popup()
	}

	_spellingSubmenu(misspelledWord: string, dictionarySuggestions: Array<string>): Menu {
		const submenu = new Menu()
		if (misspelledWord !== '') {
			dictionarySuggestions
				.map(s => new MenuItem({label: s, click: (mi, bw) => bw && bw.webContents && bw.webContents.replaceMisspelling(s)}))
				.forEach(mi => submenu.append(mi))
			submenu.append(new MenuItem({type: "separator"}))
			submenu.append(new MenuItem({
				label: lang.get("addToDict_action", {"{word}": misspelledWord}),
				click: (mi, bw) => bw && bw.webContents && bw.webContents.session.addWordToSpellCheckerDictionary(misspelledWord)
			}))
		}
		// the spellcheck API uses the OS spell checker on MacOs, the language is set in the OS settings.
		if (process.platform !== 'darwin') {
			submenu.append(new MenuItem({
				label: lang.get("changeSpellCheckLang_action"),
				click: (mi, bw) => bw && bw.webContents && this._changeSpellcheckLanguage(bw.webContents)
			}))
		}
		return submenu
	}

	_changeSpellcheckLanguage(wc: WebContents) {
		const id = BrowserWindow.fromWebContents(wc).id
		const args = [
			wc.session.getSpellCheckerLanguages()[0], // currently active
			wc.session.availableSpellCheckerLanguages
		]
		this._ipc.sendRequest(id, 'showSpellcheckDropdown', args)
		    .then(newLang => wc.session.setSpellCheckerLanguages([newLang]))
	}
}