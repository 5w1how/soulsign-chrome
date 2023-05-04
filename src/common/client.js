import utils from "./utils";
import scriptbuild from "../backend/scriptbuild";

function request(path, body) {
	return new Promise(function (resolve, reject) {
		chrome.runtime.sendMessage({path, body}, function (x) {
			if (x && x.no == 200) return resolve(x.data);
			reject(x && x.msg);
		});
	});
}

/**
 * 获取文件
 * @param {string} accept 'image/png'
 * @param {boolean} multiple
 * @returns {Promise<File|FileList>}
 */
function pick(accept, multiple) {
	return new Promise((resolve, reject) => {
		let input = document.createElement("input");
		input.type = "file";
		input.multiple = multiple;
		input.accept = accept || "*";
		input.onchange = function (e) {
			resolve(multiple ? e.target.files : e.target.files[0]);
		};
		input.click();
	});
}

function copy(str) {
	str = typeof str === "string" ? str : JSON.stringify(str);
	var success = false;
	try {
		var input = document.createElement("textarea");
		input.style.position = "fixed";
		input.style.top = "-100px";
		input.value = str;
		document.body.appendChild(input);
		input.select();
		input.setSelectionRange(0, str.length);
		success = document.execCommand("copy");
		document.body.removeChild(input);
	} catch (error) {}
	return success;
}

function readAsText(file) {
	return new Promise((resolve, reject) => {
		let fr = new FileReader();
		fr.readAsText(file);
		fr.onload = (e) => {
			resolve(e.target.result);
		};
	});
}

function loading(name = "loading") {
	return function (target, key, descriptor) {
		const method = descriptor.value;
		descriptor.value = function () {
			if (this[name]) return;
			this[name] = true;
			let ret = method.apply(this, arguments);
			if (ret && typeof ret.then === "function") {
				return ret.then(
					(data) => {
						this[name] = false;
						return data;
					},
					(err) => {
						this[name] = false;
						return Promise.reject(err);
					}
				);
			}
			return ret;
		};
		return descriptor;
	};
}

function dataURLtoBlob(dataurl) {
	var arr = dataurl.split(",");
	var mime = arr[0].match(/:(.*?);/)[1];
	var bstr = atob(arr[1]);
	var n = bstr.length;
	var u8arr = new Uint8Array(n);
	while (n--) u8arr[n] = bstr.charCodeAt(n);
	return new Blob([u8arr], {type: mime});
}

/**
 * 保存文件
 * @param {string|Blob} txt
 * @param {string} [name]
 */
function download(txt, name) {
	if (/^(blob|https?):/.test(txt)) {
		var a = document.createElement("a");
		a.href = txt;
		a.download = name || "未命名.txt";
		a.click();
		return;
	}
	if (txt == "[object Blob]") return download(URL.createObjectURL(txt), name);
	if (/^data:/.test(txt)) return download(dataURLtoBlob(txt), name);
	return download(new Blob([txt]), name);
}

function buildScript(text) {
	let task = utils.compileTask(text);
	return scriptbuild(task);
}

export default Object.assign({}, utils, {
	request,
	pick,
	readAsText,
	loading,
	download,
	buildScript,
	copy,
});
