import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VTreeview } from 'vuetify/labs/VTreeview'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components: {
    ...components,
    VTreeview,
  },
  directives,
  icons: {
    defaultSet: 'mdi', // 设置默认图标集为 mdi
  },
})

export default vuetify