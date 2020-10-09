const JsonRpcService = require('./json-rpc.js')

class PrettierService {
	constructor() {
		this.format = this.format.bind(this)

		const [, , prettierPath] = process.argv
		this.prettier = require(prettierPath)

		this.jsonRpc = new JsonRpcService(process.stdin, process.stdout)
		this.jsonRpc.onRequest('format', this.format)
		this.jsonRpc.notify('didStart')
	}

	async format({ text, pathForConfig, ignorePath, options }) {
		try {
			let info = {}
			if (options.filepath) {
				info = await this.prettier.getFileInfo(options.filepath, {
					ignorePath,
					withNodeModules: false,
				})

				// Don't format if this file is ignored
				if (info.ignored) return null
			}

			const inferredConfig = await this.prettier.resolveConfig(pathForConfig, {
				editorconfig: true,
			})

			const config = { ...options, ...inferredConfig }

			if (!config.parser && !info.inferredParser) return null

			const formatted = this.prettier.format(text, {
				...config,
				...options,
			})

			return { formatted }
		} catch (error) {
			// Return error as object; JSON-RPC errors don't work well.
			return {
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
			}
		}
	}
}

const server = new PrettierService()
