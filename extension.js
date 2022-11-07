const vscode = require('vscode');
const fs = require('fs');
const dir = vscode.workspace.getConfiguration('zhtrans').get('readDir')
const { pinyin } = require('pinyin-pro');

//读取文本
function read(dir) {
	return new Promise((resolve, reject) => {
		fs.readFile(dir, 'utf-8', (err, data) => {
			if (err) {
				vscode.window.showInformationMessage('zh.json文件读取失败');
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

//拼音随机生成
function randomTxt(str) {
	let pinyinArr = pinyin(str, { pattern: 'initial', type: 'array' });
	let tran = pinyinArr.join('').slice(0, 6)
	return tran
}

//转换文字
function transTxt(type, isMatch, word, callback) {
	let pushWord = ''
	let frontWord = vscode.workspace.getConfiguration('zhtrans').get('AgencyNum')
	if (type == 'html') {
		pushWord = `{{$t("${isMatch ? word : frontWord + '.' + randomTxt(word)}")}}`
	} else if (type == 'js') {
		pushWord = `this.$t("${isMatch ? word : frontWord + '.' + randomTxt(word)}")`
	}
	callback(pushWord)

}

async function main(type) {
	//获取文本
	const text = await read(dir)

	const { activeTextEditor } = vscode.window // 获取当前聚焦的文本编辑器
	// 根据范围获取选中文本 
	// activeTextEditor.selection 当前选中的范围
	let currentSelect = activeTextEditor.document.getText(activeTextEditor.selection)

	currentSelect = currentSelect.replace(/"/g, '').replace(/'/g, '').trim()
	//json  to obj
	let obj = JSON.parse(text)
	let transWord = findKeyByValue(obj, currentSelect)
	//随机转换写入状态
	const freeTrans = vscode.workspace.getConfiguration('zhtrans').get('freeTrans')
	let sendText = ''
	//转换
	if (transWord) {
		//匹配成功
		transTxt(type, true, transWord, (data) => {
			activeTextEditor.edit(editBuilder => {
				editBuilder.replace(activeTextEditor.selection, data)
			})
		})
		sendText = `${currentSelect} 翻译成功！`
	} else {
		if (freeTrans) {
			transTxt(type, false, currentSelect,
				(data) => {
					activeTextEditor.edit(editBuilder => {
						editBuilder.replace(activeTextEditor.selection, data)
					})
				})
			//写入剪贴板
			vscode.env.clipboard.writeText(currentSelect)
			sendText = `${currentSelect} 随机并写入剪贴板！`
		} else {
			sendText = `${currentSelect} 翻译失败！`
		}
	}
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
