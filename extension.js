const vscode = require('vscode');
const fs = require('fs');
const dir = 'D:\\zh.json';

//读取文本
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
async function main(type) {
	//获取文本
	const text = await read(dir)
	const { activeTextEditor } = vscode.window // 获取当前聚焦的文本编辑器
	// 根据范围获取选中文本 // activeTextEditor.selection 当前选中的范围
	const currentSelect = activeTextEditor.document.getText(activeTextEditor.selection)
	//json  to obj
	let obj = JSON.parse(text)
	let transWord = findKeyByValue(obj, currentSelect)
	//转换
	if (transWord) {
		let pushword = ''
		if (type == 'html') {
			pushword = `$t("${transWord}")`
		} else if (type == 'js') {
			pushword = `this.$t("${transWord}")`
		}
		activeTextEditor.edit(editBuilder => {
			editBuilder.replace(activeTextEditor.selection, pushword)
		})
	}
	let sendText = `${currentSelect} 翻译${transWord ? '成功' : '失败'}！`
	vscode.window.showInformationMessage(sendText);
}

function activate(context) {
	let disposable1 = vscode.commands.registerCommand("zhtrans.trh", function () {
		main('html')
	});

	let disposable2 = vscode.commands.registerCommand('zhtrans.trj', function () {
		main('js')
	});
	context.subscriptions.push(disposable1, disposable2);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
