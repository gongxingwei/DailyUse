"use strict";
/**
 * Editor Module Demo
 * 编辑器模块演示
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorClientDemo = void 0;
exports.demonstrateEditorModule = demonstrateEditorModule;
// 这是一个简化的演示，展示如何使用编辑器模块
// === 1. 服务端使用示例 ===
// 创建仓储实例
function createServerComponents() {
    console.log('📦 Creating server-side components...');
    // 这些导入在实际使用时需要正确的路径
    // import { DocumentRepository, WorkspaceRepository } from '@dailyuse/domain-server';
    // 模拟创建仓储
    const documentRepository = {
        create: async (doc) => ({ ...doc, uuid: 'doc-123', createdAt: new Date() }),
        findByUuid: async (uuid) => ({ uuid, title: 'Sample Doc', content: '# Hello' }),
        search: async (query) => []
    };
    const workspaceRepository = {
        create: async (ws) => ({ ...ws, uuid: 'ws-123', createdAt: new Date() }),
        findByUuid: async (uuid) => ({ uuid, name: 'Sample Workspace' })
    };
    console.log('✅ Server components created');
    return { documentRepository, workspaceRepository };
}
// === 2. 客户端使用示例 ===
function createClientComponents() {
    console.log('🖥️  Creating client-side components...');
    // 文档管理服务
    const documentService = {
        documents: new Map(),
        addDocument: function (doc) {
            this.documents.set(doc.uuid, doc);
            console.log(`📄 Document added: ${doc.title}`);
        },
        getAllDocuments: function () {
            return Array.from(this.documents.values());
        },
        on: function (event, callback) {
            console.log(`📡 Event listener registered: ${event}`);
        }
    };
    // 工作空间管理服务
    const workspaceService = {
        workspaces: new Map(),
        addWorkspace: function (ws) {
            this.workspaces.set(ws.uuid, ws);
            console.log(`🏗️  Workspace added: ${ws.name}`);
        },
        getAllWorkspaces: function () {
            return Array.from(this.workspaces.values());
        }
    };
    // UI 适配器
    const documentListAdapter = {
        setDocuments: function (docs) {
            console.log(`📋 Document list updated: ${docs.length} documents`);
        },
        setFilterQuery: function (query) {
            console.log(`🔍 Filter applied: "${query}"`);
        }
    };
    const tabAdapter = {
        tabs: [],
        addTab: function (tab) {
            this.tabs.push(tab);
            console.log(`📑 Tab added: ${tab.title}`);
        },
        getFormattedTabs: function () {
            return this.tabs.map(tab => ({
                uuid: tab.uuid,
                title: tab.title,
                isActive: tab.isActive
            }));
        }
    };
    console.log('✅ Client components created');
    return { documentService, workspaceService, documentListAdapter, tabAdapter };
}
// === 3. 编辑器客户端门面 ===
class EditorClientDemo {
    constructor() {
        const components = createClientComponents();
        this.documentService = components.documentService;
        this.workspaceService = components.workspaceService;
        this.documentListAdapter = components.documentListAdapter;
        this.tabAdapter = components.tabAdapter;
    }
    getDocumentService() { return this.documentService; }
    getWorkspaceService() { return this.workspaceService; }
    getDocumentListAdapter() { return this.documentListAdapter; }
    getTabAdapter() { return this.tabAdapter; }
    async initialize() {
        console.log('🚀 Initializing Editor Client...');
        // 模拟初始化过程
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Editor Client initialized');
    }
}
exports.EditorClientDemo = EditorClientDemo;
// === 4. 完整使用演示 ===
async function demonstrateEditorModule() {
    console.log('🎯 Editor Module Demonstration\n');
    try {
        // 1. 创建服务端组件
        const serverComponents = createServerComponents();
        // 2. 创建客户端
        const editorClient = new EditorClientDemo();
        await editorClient.initialize();
        // 3. 文档操作演示
        console.log('\n📝 Document Operations Demo:');
        const documentService = editorClient.getDocumentService();
        // 添加文档
        documentService.addDocument({
            uuid: 'doc-1',
            title: 'My First Document',
            content: '# Hello World\n\nThis is my first markdown document.',
            format: 'markdown',
            isDirty: false
        });
        documentService.addDocument({
            uuid: 'doc-2',
            title: 'Project Notes',
            content: '## TODO\n\n- [ ] Implement editor\n- [ ] Add search\n- [ ] Write tests',
            format: 'markdown',
            isDirty: true
        });
        // 4. 工作空间操作演示
        console.log('\n🏗️  Workspace Operations Demo:');
        const workspaceService = editorClient.getWorkspaceService();
        workspaceService.addWorkspace({
            uuid: 'ws-1',
            name: 'Development Workspace',
            repositoryUuid: 'repo-1',
            openDocuments: [],
            settings: {
                theme: { name: 'vs-dark', mode: 'dark' },
                fontSize: 14
            }
        });
        // 5. UI 适配器演示
        console.log('\n🎨 UI Adapters Demo:');
        const documentListAdapter = editorClient.getDocumentListAdapter();
        const tabAdapter = editorClient.getTabAdapter();
        // 更新文档列表
        documentListAdapter.setDocuments(documentService.getAllDocuments());
        documentListAdapter.setFilterQuery('hello');
        // 添加标签页
        tabAdapter.addTab({
            uuid: 'tab-1',
            documentUuid: 'doc-1',
            title: 'My First Document',
            isActive: true,
            isDirty: false
        });
        tabAdapter.addTab({
            uuid: 'tab-2',
            documentUuid: 'doc-2',
            title: 'Project Notes',
            isActive: false,
            isDirty: true
        });
        // 6. 事件系统演示
        console.log('\n📡 Event System Demo:');
        documentService.on('documentAdded', (data) => {
            console.log('🔔 Event received: Document added');
        });
        // 触发事件
        documentService.addDocument({
            uuid: 'doc-3',
            title: 'New Document',
            content: 'Fresh content',
            format: 'markdown'
        });
        // 7. 显示统计信息
        console.log('\n📊 Statistics:');
        console.log(`  📄 Total Documents: ${documentService.getAllDocuments().length}`);
        console.log(`  🏗️  Total Workspaces: ${workspaceService.getAllWorkspaces().length}`);
        console.log(`  📑 Open Tabs: ${tabAdapter.getFormattedTabs().length}`);
        console.log('\n🎉 Editor Module Demonstration Completed Successfully!');
        console.log('\n💡 Next steps:');
        console.log('  1. Implement Vue.js UI components');
        console.log('  2. Add Monaco Editor integration');
        console.log('  3. Create REST API endpoints');
        console.log('  4. Add database persistence');
        console.log('  5. Implement real-time collaboration');
    }
    catch (error) {
        console.error('\n❌ Demo failed:', error);
    }
}
// 运行演示
if (typeof window === 'undefined') {
    // Node.js 环境
    demonstrateEditorModule();
}
else {
    // 浏览器环境
    console.log('📱 Browser environment detected');
    console.log('🔧 Run demonstrateEditorModule() to start the demo');
    window.demonstrateEditorModule = demonstrateEditorModule;
}
