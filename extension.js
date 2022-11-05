const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const dir = 'D:\\zh.json';

function read(dir) {
	return new Promise((resolve, reject) => {
		fs.readFile(dir, 'utf-8', (err, data) => {
			if (err) {
				vscode.window.showInformationMessage('D盘下存放zh.json');
				return
			} else {
				resolve(data)
			}
		})
	})
}
//value 获取key
function findKeyByValue(obj, value) {
	for (let key in obj) {
		for (let childkey in obj[key]) {
			if (obj[key][childkey] === value) {
				return `${key}.${childkey}`
			}
		}
	}
	return null
}

function activate(context) {

	let disposable1 = vscode.commands.registerCommand("firstvs.transHTML", async function () {
		//获取文本
		const text = await read(dir)
		const { activeTextEditor } = vscode.window // 获取当前聚焦的文本编辑器
		// activeTextEditor!.selection 当前选中的范围
		const currentSelect = activeTextEditor.document.getText(activeTextEditor.selection) // 根据范围获取选中文本
		//json  to obj
		let obj = JSON.parse(text)
		let transWord = findKeyByValue(obj, currentSelect)

		if (transWord) {
			let pushword = `$t("${transWord}")`
			activeTextEditor.edit(editBuilder => {
				editBuilder.replace(activeTextEditor.selection, pushword)
			})
			vscode.window.showInformationMessage(currentSelect + '翻译html成功');
		} else {
			vscode.window.showInformationMessage(currentSelect + '匹配html失败');
		}


	});
	let disposable2 = vscode.commands.registerCommand('firstvs.transJS', function () {

		const { activeTextEditor } = vscode.window // 获取当前聚焦的文本编辑器
		// activeTextEditor!.selection 当前选中的范围
		const currentSelect = activeTextEditor.document.getText(activeTextEditor.selection) // 根据范围获取选中文本
		//json to obj
		let obj = JSON.parse(jsonStr)
		let transWord = findKeyByValue(obj, currentSelect)
		if (transWord) {
			let pushword = `this.$t("${transWord}")`
			activeTextEditor.edit(editBuilder => {
				editBuilder.replace(activeTextEditor.selection, pushword)
			})
			vscode.window.showInformationMessage(currentSelect + '翻译js成功');
		} else {
			vscode.window.showInformationMessage(currentSelect + '匹配js失败');
		}


	});
	context.subscriptions.push(disposable1, disposable2);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
