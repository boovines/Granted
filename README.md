
# Academic Writing IDE

An IDE-like interface (inspired by Cursor/VS Code) designed specifically for academic writing and essay composition instead of coding. This application provides a structured environment for managing academic writing projects with intelligent context-aware assistance.

## Core Concept

This is a domain-specific writing IDE that organizes content into three distinct file types, each serving a specific purpose in the academic writing workflow:

### File System Architecture

#### 1. **Rules** (Always in Context)
- **Purpose**: Assignment constraints, prompts, writing style guidelines, and grammar preferences
- **Function**: Acts as the "system prompt" and style enforcer
- **Behavior**: Always fed into AI context to maintain consistency with assignment requirements

#### 2. **Sources** (Research Library)
- **Purpose**: External references, readings, citations, and research materials
- **Function**: Acts as your research library
- **Behavior**: AI assistant can pull quotes, suggest citations, and help with integration when explicitly added to context

#### 3. **Documents** (Working Materials)
- **Purpose**: Your actual working materials (outlines, drafts, brainstorm lists, bibliography, notes, etc.)
- **Function**: Optional context inclusion via highlight → "add to context" action
- **Behavior**: Allows selective passage inclusion without cluttering the AI context

## Interaction Model

- **Non-sourcing chat requests** (style, structure, clarity) always include Rules in context
- **Highlighted text** in Sources or Documents can be explicitly added to context
- **Dynamic context combination** allows fluid movement between brainstorming, outlining, writing, and citing
- **Context length management** prevents overwhelming the AI assistant

## Design Philosophy

The application provides a seamless workflow for academic writing where:
- **Rules** = Guardrails (assignment instructions, style guide)
- **Sources** = Research/citations library  
- **Documents** = Working drafts/notes

The AI assistant can dynamically combine these elements into context depending on your current intent and workflow stage.

## Visual Design

- **Color Theme**: Softer, academic tones rather than traditional developer dark themes
- **Interface**: IDE-inspired layout optimized for writing workflows
- **Branding**: Academic-focused aesthetic appropriate for scholarly work

## Getting Started

This is a code bundle for the Academic Writing IDE. The original design is available at https://www.figma.com/design/oaD0n6dCzSLOUsufB8DScy/Cursor-Style-Essay-App-with-Context-Picker.

### Installation

```bash
npm i
```

### Development

```bash
npm run dev
```

## Project Structure

- `src/components/` - React components for the IDE interface
- `src/components/ui/` - Reusable UI components
- `src/guidelines/` - Writing guidelines and rules
- `src/styles/` - Styling and theming

## Contributing

This project aims to create an intuitive, powerful tool for academic writers by combining the efficiency of modern IDE interfaces with the specific needs of scholarly writing workflows.


Run `npm i` to install the dependencies.
Run `npm run dev` to start the development server.