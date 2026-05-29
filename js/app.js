document.addEventListener('DOMContentLoaded', function() {
    loadPrototypes();
    
    document.getElementById('searchInput').addEventListener('input', debounce(searchPrototypes, 300));
    document.getElementById('refreshBtn').addEventListener('click', loadPrototypes);
    document.getElementById('createFolderBtn').addEventListener('click', openFolderModal);
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
});

let prototypeData = { folders: [], ungrouped: [] };
let selectedFiles = [];

// 使用图片图标而非emoji

async function loadPrototypes() {
    const grid = document.getElementById('prototypesGrid');
    grid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>正在加载原型列表...</p>
        </div>
    `;

    try {
        const response = await fetch('prototypes/list.json');
        if (response.ok) {
            prototypeData = await response.json();
            renderPrototypes(prototypeData);
        } else {
            console.warn('list.json 不存在，使用默认数据');
            prototypeData = { 
                folders: [], 
                ungrouped: [
                    { name: '示例原型', filename: 'example1.html', description: '示例原型', size: '2.5 KB', modified: '2024-01-15' }
                ]
            };
            renderPrototypes(prototypeData);
        }
    } catch (error) {
        console.warn('无法加载list.json');
        prototypeData = { folders: [], ungrouped: [] };
        renderEmptyState();
    }
}

function renderPrototypes(data) {
    const grid = document.getElementById('prototypesGrid');
    const totalCount = document.getElementById('totalCount');
    const folderCount = document.getElementById('folderCount');
    
    const totalPrototypes = data.folders.reduce((sum, folder) => sum + folder.prototypes.length, 0) + data.ungrouped.length;
    totalCount.textContent = totalPrototypes;
    folderCount.textContent = data.folders.length;
    
    if (totalPrototypes === 0) {
        renderEmptyState();
        return;
    }
    
    let html = '';
    
    data.folders.forEach((folder) => {
        html += `
            <div class="folder-card">
                <div class="folder-header">
                    <div class="folder-icon"></div>
                    <h3>${folder.name}</h3>
                    <p>${folder.description || `${folder.prototypes.length} 个原型`}</p>
                </div>
                <div class="folder-content">
                    ${folder.prototypes.map((proto) => `
                        <div class="prototype-item" onclick="openPreview('${proto.filename}', '${proto.name}')">
                            <span class="name">${proto.name}</span>
                            <span class="size">${proto.size}</span>
                            <div class="actions">
                                <button onclick="event.stopPropagation(); window.open('prototypes/${proto.filename}', '_blank')">打开</button>
                                <button onclick="event.stopPropagation(); downloadFile('${proto.filename}')">下载</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    data.ungrouped.forEach((proto) => {
        html += `
            <div class="prototype-card" onclick="openPreview('${proto.filename}', '${proto.name}')">
                <div class="thumbnail">
                    <span class="icon"></span>
                </div>
                <div class="info">
                    <span class="category">未分组</span>
                    <h3 title="${proto.name}">${proto.name}</h3>
                    <p>${proto.description}</p>
                    <div class="meta">
                        <span class="date">${proto.modified}</span>
                        <div class="actions">
                            <button onclick="event.stopPropagation(); window.open('prototypes/${proto.filename}', '_blank')">打开</button>
                            <button onclick="event.stopPropagation(); downloadFile('${proto.filename}')">下载</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function downloadFile(filename) {
    const link = document.createElement('a');
    link.href = `prototypes/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderEmptyState() {
    const grid = document.getElementById('prototypesGrid');
    const totalCount = document.getElementById('totalCount');
    const folderCount = document.getElementById('folderCount');
    
    totalCount.textContent = '0';
    folderCount.textContent = '0';
    
    grid.innerHTML = `
        <div class="empty-state">
            <span class="icon"></span>
            <h3>暂无原型文件</h3>
            <p>点击上方的"上传文件"按钮添加HTML原型<br>或创建文件夹组织你的原型</p>
        </div>
    `;
}

function searchPrototypes() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    if (!query.trim()) {
        renderPrototypes(prototypeData);
        return;
    }
    
    const filtered = {
        folders: prototypeData.folders.map(folder => ({
            ...folder,
            prototypes: folder.prototypes.filter(proto => 
                proto.name.toLowerCase().includes(query) ||
                proto.description.toLowerCase().includes(query) ||
                proto.filename.toLowerCase().includes(query)
            )
        })).filter(folder => folder.prototypes.length > 0),
        ungrouped: prototypeData.ungrouped.filter(proto =>
            proto.name.toLowerCase().includes(query) ||
            proto.description.toLowerCase().includes(query) ||
            proto.filename.toLowerCase().includes(query)
        )
    };
    
    renderPrototypes(filtered);
}

function debounce(func, wait) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}

function openPreview(filename, title) {
    const modal = document.createElement('div');
    modal.className = 'preview-modal active';
    modal.innerHTML = `
        <div class="modal-header">
            <span class="title">${title}</span>
            <button class="close-btn" onclick="closePreview()">✕</button>
        </div>
        <div class="modal-content">
            <iframe src="prototypes/${filename}" title="${title}"></iframe>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePreview();
        }
    });
    
    document.addEventListener('keydown', function handleKeydown(e) {
        if (e.key === 'Escape') {
            closePreview();
            document.removeEventListener('keydown', handleKeydown);
        }
    });
}

function closePreview() {
    const modal = document.querySelector('.preview-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// 新建文件夹功能
function openFolderModal() {
    document.getElementById('folderModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFolderModal() {
    document.getElementById('folderModal').classList.remove('active');
    document.getElementById('folderNameInput').value = '';
    document.getElementById('folderDescInput').value = '';
    document.body.style.overflow = '';
}

function createFolder() {
    const name = document.getElementById('folderNameInput').value.trim();
    const description = document.getElementById('folderDescInput').value.trim();
    
    if (!name) {
        alert('请输入文件夹名称');
        return;
    }
    
    const newFolder = {
        id: 'folder-' + Date.now(),
        name: name,
        description: description,
        prototypes: []
    };
    
    prototypeData.folders.push(newFolder);
    saveListJson();
    closeFolderModal();
    loadPrototypes();
}

// 上传功能
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    selectedFiles = selectedFiles.concat(files);
    showUploadModal();
}

function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    const list = document.getElementById('uploadFilesList');
    
    list.innerHTML = selectedFiles.map((file, index) => `
        <div class="upload-file-item">
            <span class="icon">📄</span>
            <div class="info">
                <div class="name">${file.name}</div>
                <div class="size">${formatFileSize(file.size)}</div>
            </div>
            <button class="remove-btn" onclick="removeFile(${index})">✕</button>
        </div>
    `).join('');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('fileInput').value = '';
    document.body.style.overflow = '';
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    showUploadModal();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function startUpload() {
    if (selectedFiles.length === 0) {
        alert('请选择要上传的文件');
        return;
    }
    
    const progressBar = document.querySelector('#uploadProgress .progress-fill');
    progressBar.style.width = '0%';
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await uploadFile(file);
        
        const progress = ((i + 1) / selectedFiles.length) * 100;
        progressBar.style.width = progress + '%';
    }
    
    await saveListJson();
    closeUploadModal();
    selectedFiles = [];
    loadPrototypes();
    alert('上传完成！');
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            console.error('上传失败:', response.status);
        }
    } catch (error) {
        console.error('上传错误:', error);
    }
}

function saveListJson() {
    fetch('/save_list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(prototypeData)
    }).catch(error => {
        console.warn('无法保存list.json:', error);
    });
}
