import os
import json
import glob

def get_file_size(filepath):
    size = os.path.getsize(filepath)
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    else:
        return f"{size / (1024 * 1024):.1f} MB"

def get_file_modified(filepath):
    mtime = os.path.getmtime(filepath)
    import datetime
    return datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")

def generate_list():
    prototypes_dir = "prototypes"
    html_files = glob.glob(os.path.join(prototypes_dir, "*.html"))
    
    prototypes = []
    
    for filepath in html_files:
        filename = os.path.basename(filepath)
        name = filename.replace(".html", "").replace("-", " ").replace("_", " ").title()
        
        category_map = {
            "login": "认证",
            "auth": "认证",
            "dashboard": "仪表盘",
            "analytics": "仪表盘",
            "product": "电商",
            "catalog": "电商",
            "ecommerce": "电商",
            "home": "首页",
            "index": "首页",
            "form": "表单",
            "profile": "个人中心",
            "settings": "设置",
        }
        
        category = "其他"
        for keyword, cat in category_map.items():
            if keyword.lower() in filename.lower():
                category = cat
                break
        
        prototypes.append({
            "name": name,
            "filename": filename,
            "description": f"{name} - HTML原型",
            "category": category,
            "size": get_file_size(filepath),
            "modified": get_file_modified(filepath)
        })
    
    prototypes.sort(key=lambda x: x["name"])
    
    with open(os.path.join(prototypes_dir, "list.json"), "w", encoding="utf-8") as f:
        json.dump(prototypes, f, ensure_ascii=False, indent=2)
    
    print(f"已更新 list.json，共 {len(prototypes)} 个原型文件")

if __name__ == "__main__":
    generate_list()
