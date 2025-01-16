const { contextBridge } = require('electron');
const THREE = require('three');

contextBridge.exposeInMainWorld('THREE', THREE);