export interface line {
	externalLinkFormat: string 
	internalLinkFormat: string
	wikilinks?: wikilinkResult[]
}


interface wikilinkResult {
	link: string
	text: string
}

interface taskObject {
	indentation: string // tabs, spaces and > for potentially nested blockquotes or Obsidian callouts
	marker: string // -, * etc
	status: string // [x] [>] etc
	text: string // everything after [ ]
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

/**
 * Create an object from the string
 * @param line 
 * @returns taskObject
 */
export function taskObject(line: string): taskObject {
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

  const regexMatch = line.match(taskRegex);
  if (regexMatch === null) {
    return null;
  }

  return {
    indentation: regexMatch[1],
    marker: regexMatch[2],
    status: regexMatch[3],
    text: regexMatch[4].trim(),
  };
}


/**
 * Checks to see if a string is a markdown task according to
 * obsidian-tasks plugin's rules (but without a tasks plugin dependency)
 * @param line
 * @returns boolean
 */
export function isTask(line: string): boolean {
	const isTask = taskObject(line);
  if (isTask !== null) {
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
	const task = taskObject(line);
  if (task !== null) {
    return task.text
  }

	return line
}

/**
 * Get a due date from the task string (uses tasks plugin format)
 * @param line 
 * @returns due, start or scheduled date (in order of priority)
 */
export function getDueDate(line: string): string {
  let matched: boolean;
  let scheduledDate: string | null = null;
  let dueDate: string | null = null;
  let startDate: string | null = null;

  const startDateRegex = /🛫 *(\d{4}-\d{2}-\d{2})$/u;
  const scheduledDateRegex = /[⏳⌛] *(\d{4}-\d{2}-\d{2})$/u;
  const dueDateRegex = /[📅📆🗓] *(\d{4}-\d{2}-\d{2})$/u;

  const maxRuns = 20;
  let runs = 0;
  do {
    matched = false;

    const dueDateMatch = line.match(dueDateRegex);
    if (dueDateMatch !== null) {
      dueDate = dueDateMatch[1];
      line = line.replace(dueDateRegex, "").trim();
      matched = true;
    }

    const scheduledDateMatch = line.match(scheduledDateRegex);
    if (scheduledDateMatch !== null) {
      scheduledDate = scheduledDateMatch[1];
      line = line.replace(scheduledDateRegex, "").trim();
      matched = true;
    }

    const startDateMatch = line.match(startDateRegex);
    if (startDateMatch !== null) {
      startDate = startDateMatch[1];
      line = line.replace(startDateRegex, "").trim();
      matched = true;
    }

    runs++;
  } while (matched && runs <= maxRuns);
  const dates = [dueDate, scheduledDate, startDate];
  const taskDueDate = dates.find((d) => d !== null);

  return taskDueDate;
}



