import { boot } from 'quasar/wrappers'
import { createAuth0 } from '@auth0/auth0-vue';

export default boot( async ({ app }) => {
  app.use(createAuth0({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENTID,
    authorizationParams: {
      redirect_uri: window.location.origin
    }
  }))
})

