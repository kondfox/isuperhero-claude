import type { Preview } from '@storybook/react'
import '../src/styles/tokens.css'
import '../src/styles/reset.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'cosmic',
      values: [
        { name: 'cosmic', value: '#0d0b2e' },
        { name: 'surface', value: '#1a1648' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
}

export default preview
