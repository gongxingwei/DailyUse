import { link } from "node:fs";

export default {
    title: 'Settings',
    general: {
      title: 'General',
      theme: {
        label: 'Theme Mode',
        system: 'Follow System',
        dark: 'Dark Mode',
        light: 'Light Mode',
        blueGreen: 'Blue Green'
      },
      language: {
        label: 'Language',
        zhCN: '简体中文',
        enUS: 'English'
      },
      autoLaunch: {
        label: 'Auto Launch',
        on: 'Enable',
        off: 'Disable'
      }
    },
    editor: {
      title: 'Editor',
      fontSize: 'Font Size',
      wordWrap: {
        label: 'Word Wrap',
        on: 'On',
        off: 'Off'
      },
      lineNumbers: {
        label: 'Line Numbers',
        show: 'Show',
        hide: 'Hide'
      },
      minimap: {
        label: 'Minimap',
        show: 'Show',
        hide: 'Hide'
      },
      autoSave: {
        label: 'Auto Save',
        on: 'On',
        off: 'Off'
      },
      fontFamily: {
        label: 'Font Family',
        consolas: 'Consolas',
        sourceCodePro: 'Source Code Pro',
        firaCode: 'Fira Code',
        jetbrainsMono: 'JetBrains Mono'
      },
      tabSize: {
        label: 'Tab Size'
      },
      autoIndent: {
        label: 'Auto Indent',
        none: 'None',
        keep: 'Keep',
        brackets: 'Brackets',
        advanced: 'Advanced'
      },
      autoClosingBrackets: {
        label: 'Auto Close Brackets',
        always: 'Always',
        languageDefined: 'Language Defined',
        beforeWhitespace: 'Before Whitespace',
        never: 'Never'
      },
      renderWhitespace: {
        label: 'Show Whitespace',
        none: 'None',
        boundary: 'Boundary',
        selection: 'Selection',
        trailing: 'Trailing',
        all: 'All'
      },
      cursorStyle: {
        label: 'Cursor Style',
        line: 'Line',
        block: 'Block',
        underline: 'Underline',
        lineThin: 'Thin Line',
        blockOutline: 'Block Outline',
        underlineThin: 'Thin Underline'
      },
      cursorBlinking: {
        label: 'Cursor Blinking',
        blink: 'Blink',
        smooth: 'Smooth',
        phase: 'Phase',
        expand: 'Expand',
        solid: 'Solid'
      },
      smoothScrolling: {
        label: 'Smooth Scrolling',
        on: 'On',
        off: 'Off'
      },
      mouseWheelZoom: {
        label: 'Mouse Wheel Zoom',
        on: 'On',
        off: 'Off'
      },
      lineHeight: {
        label: 'Line Height'
      },
      insertImage: {
        label: 'Insert Image',
        embed: 'Embed',
        link: 'Link'
      },
    },
    file: {
      title: 'Files',
      showHiddenFiles: {
        label: 'Show Hidden Files',
        show: 'Show',
        hide: 'Hide'
      }
    },
    about: {
      title: 'About',
      version: 'DailyUse v1.0.0',
      description: 'A simple personal knowledge management tool'
    }
  }