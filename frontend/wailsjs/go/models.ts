export namespace main {
	
	export class CopyItem {
	    src: string;
	    order: number;
	    newName: string;
	
	    static createFrom(source: any = {}) {
	        return new CopyItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.src = source["src"];
	        this.order = source["order"];
	        this.newName = source["newName"];
	    }
	}
	export class CopyRequest {
	    dest: string;
	    overwrite: boolean;
	    items: CopyItem[];
	
	    static createFrom(source: any = {}) {
	        return new CopyRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dest = source["dest"];
	        this.overwrite = source["overwrite"];
	        this.items = this.convertValues(source["items"], CopyItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CopySummary {
	    total: number;
	    copied: number;
	    failedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new CopySummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.copied = source["copied"];
	        this.failedAt = source["failedAt"];
	    }
	}
	export class FileInfo {
	    name: string;
	    fullPath: string;
	    relPath: string;
	    isDir: boolean;
	    size: number;
	    modTime: number;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.fullPath = source["fullPath"];
	        this.relPath = source["relPath"];
	        this.isDir = source["isDir"];
	        this.size = source["size"];
	        this.modTime = source["modTime"];
	    }
	}
	export class ListOptions {
	    dir: string;
	    recursive: boolean;
	    includeDirs: boolean;
	    filterText: string;
	    sortBy: string;
	    desc: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ListOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dir = source["dir"];
	        this.recursive = source["recursive"];
	        this.includeDirs = source["includeDirs"];
	        this.filterText = source["filterText"];
	        this.sortBy = source["sortBy"];
	        this.desc = source["desc"];
	    }
	}

}

