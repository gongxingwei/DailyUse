export class LocalDataService {
    private static instance: LocalDataService;
    
    private constructor() {}
    
    public static getInstance(): LocalDataService {
        if (!LocalDataService.instance) {
        LocalDataService.instance = new LocalDataService();
        }
        return LocalDataService.instance;
    }
}