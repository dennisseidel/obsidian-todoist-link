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



// Matches indentation before a list marker (including > for potentially nested blockquotes or Obsidian callouts)
const indentationRegex = /^([\s\t>]*)/;

// Matches list markers (-, * 1.)
const listMarkerRegex = /([-*]|[0-9]+\.)/;

// Matches checkbox and status character inside
const checkboxRegex = /\[(.)\]/u;

// Match after the checkbox.
const afterCheckboxRegex = / *(.*)/u;

// Regex for parsing a line, it matches, indentation, list marker, status and the rest of the line
const taskRegex = new RegExp(
  indentationRegex.source +
    listMarkerRegex.source +
    " +" +
    checkboxRegex.source +
    afterCheckboxRegex.source,
  "u"
);

/**
 * Checks to see if a string is a markdowb task according to
 * obsidian-tasks plugin's rules (but without a tasks plugin dependency)
 * @param line
 * @returns boolean
 */
export function isTask(line: string): boolean {
  const regexMatch = line.match(taskRegex);
  if (regexMatch !== null) {
    return true;
  }
  return false;
}

/**
 * Remove task related markdown from a string
 * @param line
 * @returns string without task related markdown
 */
export function clearTaskFormatting(line: string): string {
  if (isTask(line)) {
    const regexMatch = line.match(taskRegex);
    // match[4] includes the whole body of the task after the brackets.
    return regexMatch[4].trim();
  }
  return line;
}
