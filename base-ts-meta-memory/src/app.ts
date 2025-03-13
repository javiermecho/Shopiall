
import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { faqFlow } from './templates/faqFlow'
import sheetsService from './services/sheetsService'
import { registerFlow } from './templates/registerFlow'
import { config } from "./config"

const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword<Provider, Database>(['hi', 'hello', 'hola'])
    .addAnswer('Bienvenido a shopiall en que podemos ayudarte', { capture: true, buttons: [{ body: "Comprar un Celu" }, { body: "Reparar un Celu" }] },
        async (ctx, ctxFn) => {
            if (ctx.body === "Comprar un Celu") {
                return ctxFn.endFlow("Queres que te pase la lista de precios?")
            } else if (ctx.body === "Reparar un Celu") {
                await ctxFn.flowDynamic("Perfecto, voy a proceder a hacerte algunas preguntas")
            } else {
                return ctxFn.fallBack("Tenes que elegir alguna de las opciones!")
            }
        })


const mainFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, ctxfn) => {
        const isUser = await sheetsService.userExists(ctx.from)
        if (!isUser) {
            return ctxfn.gotoFlow(registerFlow)
        } else {
            ctxfn.gotoFlow(faqFlow)
        }
    })
export { mainFlow }

/*const mainFlow = addKeyword(EVENTS.WELCOME)
.addAction( async(ctx, ctxfn) => {
   return ctxfn.gotoFlow(faqFlow)
})
export {mainFlow}*/


const main = async () => {
    const adapterFlow = createFlow([mainFlow, faqFlow, welcomeFlow, registerFlow])
    const adapterProvider = createProvider(Provider, {
        jwtToken: config.jwtToken,
        numberId: config.numberId,
        verifyToken: config.verifyToken,
        version: config.version


    })
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    /*adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )*/

    httpServer(+PORT)
}

main()
