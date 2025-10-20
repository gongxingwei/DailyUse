# DailyUse BMAD Agent Team Configuration

This directory contains BMAD agent and team configurations for the DailyUse project, enabling AI-powered collaborative development.

## 📁 Directory Structure

```
web-bundles/
├── agents/                                    # Individual agent configurations
│   ├── dailyuse-orchestrator.txt            # Central coordinator
│   ├── dailyuse-product-manager.txt         # Feature innovation & specs
│   ├── dailyuse-project-manager.txt         # Implementation planning
│   ├── dailyuse-architect.txt               # Architecture design
│   ├── dailyuse-fullstack-developer.txt     # End-to-end implementation
│   ├── dailyuse-quality-guardian.txt        # Code review & standards
│   └── dailyuse-migration-specialist.txt    # Migrations & deployments
└── teams/                                     # Team bundles
    └── dailyuse-fullstack-team.txt          # Complete development team
```

## 🎯 Agent Overview

### 1. DailyUse Orchestrator 🎯
**Central coordinator and traffic controller**

- Routes requests to appropriate specialists
- Coordinates multi-agent workflows
- Ensures quality and consistency
- Maintains project big picture

**Use When**: Unsure which specialist to use, need coordination

### 2. Product Manager 📊
**Feature innovation and specification**

- Beyond-CRUD feature ideation
- RICE prioritization
- Feature Spec creation (with Gherkin)
- Metrics and acceptance criteria

**Use When**: Brainstorming features, creating specs, prioritizing backlog

### 3. Project Manager 🚀
**Implementation planning and delivery**

- Convert Feature Specs to Implementation Flows
- Break down complex features
- Dependency and risk analysis
- Task assignment and tracking

**Use When**: Planning implementation, analyzing dependencies

### 4. System Architect 🏗️
**Architecture design and technical leadership**

- DDD + Contracts-First architecture
- Aggregate Root patterns
- Event-driven vs Saga decisions
- Repository interface design

**Use When**: Designing architecture, making technical decisions

### 5. Full-Stack Developer 💻
**End-to-end implementation**

- Vue3 + Express + Prisma implementation
- Frontend UI components
- Backend APIs
- Database operations

**Use When**: Implementing features, writing code, debugging

### 6. Code Quality Guardian 🛡️
**Standards enforcement and code review**

- DDD compliance checking
- Naming conventions validation
- Refactoring suggestions
- Quality gates enforcement

**Use When**: Reviewing code, ensuring standards compliance

### 7. Migration Specialist 🔄
**Technology and data migrations**

- MonoRepo migrations
- Framework upgrades (Vue2→Vue3)
- Database migrations
- Containerization

**Use When**: Planning or executing migrations

## 🚀 Quick Start

### Option 1: Use Web UI (Gemini Gem / Custom GPT)
1. Navigate to `web-bundles/teams/`
2. Copy `dailyuse-fullstack-team.txt` content
3. Create a new Gemini Gem or Custom GPT
4. Upload the team file
5. Set instructions: "Your critical operating instructions are attached, do not break character as directed"
6. Start chatting!

### Option 2: Use Individual Agents
1. Navigate to `web-bundles/agents/`
2. Choose the appropriate agent for your task
3. Copy the agent configuration
4. Create a new agent in your AI platform
5. Paste the configuration

### Option 3: Use IDE (with BMAD installer)
```bash
npx bmad-method install
# Follow prompts to select IDE integration
```

## 📋 Common Workflows

### New Feature Development (Full Cycle)
```
1. Product Manager: Generate feature spec
   Command: "为 goal 模块生成功能构思"

2. Project Manager: Create implementation flow
   Command: "分析 goal 模块的功能需求的实现"

3. System Architect: Review architecture
   Command: "Review architecture for focus cycle feature"

4. Full-Stack Developer: Implement
   Command: "实现 goal 的专注周期功能"

5. Code Quality Guardian: Review
   Command: "Review this implementation"
```

### Quick Implementation
```
1. Full-Stack Developer: Implement
   Command: "实现 {feature}"

2. Code Quality Guardian: Review
   Command: "Review this code"
```

### Architecture Design
```
1. System Architect: Design
   Command: "设计 {module} 的架构"

2. Code Quality Guardian: Validate
   Command: "Check architecture compliance"
```

## 🎓 Best Practices

### Choosing the Right Agent

| Task | Primary Agent | Secondary Agents |
|------|---------------|------------------|
| Feature ideation | Product Manager | - |
| Implementation planning | Project Manager | System Architect |
| Architecture design | System Architect | - |
| Coding | Full-Stack Developer | System Architect |
| Code review | Code Quality Guardian | System Architect |
| Migration | Migration Specialist | System Architect |

### Activation Phrases

#### Chinese
- "为 {模块} 生成功能构思"
- "分析 {模块} 模块的功能需求的实现"
- "设计 {模块} 的架构"
- "实现 {功能}"
- "Review this code"
- "迁移到 {技术栈}"

#### English
- "Create feature spec for {feature}"
- "Generate implementation plan for {module}"
- "Design architecture for {module}"
- "Implement {feature}"
- "Review this implementation"
- "Migrate to {technology}"

## 📚 DailyUse Context

All agents are pre-configured with DailyUse project context:

- **Architecture**: DDD + Contracts-First + MonoRepo
- **Tech Stack**: Vue3, Electron, Express, Prisma, pnpm, Nx
- **Conventions**: Time fields as `number`, PersistenceDTO in camelCase
- **Patterns**: Aggregate Root control, Event-driven communication
- **Stage**: Initial development (no backward compatibility)

## 🔄 Updating Agents

When the source prompts in `.github/prompts/` are updated:

1. Regenerate agent configurations using the same mapping strategy
2. Test updated agents with sample queries
3. Update version numbers in this README

## 📖 Additional Resources

- **Source Prompts**: `.github/prompts/` - Original prompt files
- **Module Docs**: `docs/modules/` - Module-specific documentation
- **Architecture Docs**: `docs/architecture/` - Architecture decision records
- **BMAD Docs**: [BMAD-METHOD GitHub](https://github.com/bmad-code-org/BMAD-METHOD)

## 🤝 Contributing

To modify or extend agents:

1. Update source prompts in `.github/prompts/`
2. Regenerate agent configurations
3. Test thoroughly with real scenarios
4. Update this README with any new patterns

## 📝 Version History

- **v1.0** (2025-01-20): Initial agent team configuration
  - 7 agents created from existing prompts
  - Optimized for role clarity and workflow efficiency
  - Includes full-stack team bundle

## 🆘 Support

If you encounter issues:

1. Start with **Orchestrator** for guidance
2. Check agent-specific documentation
3. Review common workflows above
4. Consult source prompts in `.github/prompts/`

---

**Happy Building! 🚀**

Generated by: DailyUse BMAD Configuration System
Date: 2025-01-20
