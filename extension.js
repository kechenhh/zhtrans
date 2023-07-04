const vscode = require('vscode');
const fs = require('fs');
const dir = vscode.workspace.getConfiguration('zhtrans').get('readDir')
const writeDir = vscode.workspace.getConfiguration('zhtrans').get('writeDir')
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
	// 前缀
	let frontWord = vscode.workspace.getConfiguration('zhtrans').get('AgencyNum')
	let trsName = isMatch ? word : frontWord + '.' + randomTxt(word)
	callback({
		trh: `{{$t("${trsName}")}}`,
		trj: `this.$t("${trsName}")`,
		trLabel: `:label = "\`\${$t('${trsName}')}：\`"`,
	}[type], trsName)

}
async function wirteFun(currentSelect, trsName) {
	let model = trsName.split('.')[0]
	let info = trsName.split('.')[1]

	//获取文本
	let ZHtext = await read(writeDir)
	let fileObj = JSON.parse(ZHtext)

	if (!fileObj.hasOwnProperty(model)) {
		fileObj[model] = {};
	}
	fileObj[model][info] = currentSelect;
	let inStr = JSON.stringify(fileObj)

	fs.writeFile(writeDir, inStr, err => {
		if (err) return
		vscode.window.showInformationMessage(`${currentSelect} 随机并写入文件！`);
	})
}
async function main(type) {
	//获取文本
	const text = await read(dir)

	const { activeTextEditor } = vscode.window // 获取当前聚焦的文本编辑器
	// 根据范围获取选中文本 
	// activeTextEditor.selection 当前选中的范围
	let currentSelect = activeTextEditor.document.getText(activeTextEditor.selection)
	if (type == 'trj' || type == 'trLabel') {
		// 匹配引号中内容
		const regex = /(['"])(.*?)\1/g;
		let match;
		while ((match = regex.exec(currentSelect)) !== null) {
			const matchedValue = match[2];
			currentSelect = matchedValue
		}
	}
	//json  to obj
	let obj = JSON.parse(text)
	let transWord = findKeyByValue(obj, currentSelect)
	//随机转换状态
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
				(data, trsName) => {
					activeTextEditor.edit(editBuilder => {
						editBuilder.replace(activeTextEditor.selection, data)
					})
					// 随机转换写入
					const transWrite = vscode.workspace.getConfiguration('zhtrans').get('transWrite')
					if (transWrite) {
						wirteFun(currentSelect, trsName)
					}
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

// 命令
function activate(context) {
	context.subscriptions.push(...[
		'trh', 'trj', 'trLabel'
	].map(item => {
		return vscode.commands.registerCommand('zhtrans.' + item, function () {
			main(item)
		});
	}));
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
