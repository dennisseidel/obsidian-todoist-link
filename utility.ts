export interface line {
	externalLinkFormat: string 
	internalLinkFormat: string
	wikilinks?: wikilinkResult[]
}


interface wikilinkResult {
	link: string
	text: string
}


export function findWikiLink(line: string): wikilinkResult[] {
	const match = line.match(/\[\[([^\]]+)\]\]/g)
	const result: wikilinkResult[] = [] 
	if (match) {
		for (const link in match) {
			const linkText = match[link]
			result.push({
				link: linkText,
				text: linkText.substring(2, linkText.length - 2),
			})
		}	
	}
	return result
}