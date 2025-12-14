export namespace main {
	
	export class FileInfo {
	    name: string;
	    fullPath: string;
	    isDir: boolean;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.fullPath = source["fullPath"];
	        this.isDir = source["isDir"];
	        this.size = source["size"];
	    }
	}

}

