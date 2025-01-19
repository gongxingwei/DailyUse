import { createApp, h } from 'vue'
import Dialog from '../components/common/Dialog.vue'

interface DialogOptions {
  title?: string
  content: string | (() => JSX.Element)
  width?: string | number
  showClose?: boolean
  closeOnClickMask?: boolean
  onClose?: () => void
  footer?: (() => JSX.Element) | null
}

export const showDialog = (options: DialogOptions) => {
  const container = document.createElement('div')
  
  const app = createApp({
    setup() {
      const destroy = () => {
        app.unmount()
        container.remove()
      }

      const handleClose = () => {
        options.onClose?.()
        destroy()
      }

      return () => h(Dialog, {
        visible: true,
        title: options.title,
        width: options.width,
        showClose: options.showClose ?? true,
        closeOnClickMask: options.closeOnClickMask ?? true,
        onClose: handleClose,
      }, {
        default: () => typeof options.content === 'string' 
          ? options.content 
          : h(options.content),
        ...(options.footer === undefined 
          ? {} 
          : { footer: () => options.footer && h(options.footer) })
      })
    }
  })

  document.body.appendChild(container)
  app.mount(container)
}
