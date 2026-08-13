import enData from '../../../../task/mocks/i18n.en.json';
import deData from '../../../../task/mocks/i18n.de.json';
import { DictionarySchema, type Dictionary, type Locale } from '$lib/schemas';

const dictionaries: Record<Locale, Dictionary> = {
	en: DictionarySchema.parse(enData),
	de: DictionarySchema.parse(deData)
};

export function getDictionary(locale: Locale): Dictionary {
	return dictionaries[locale];
}

export function translate(
	dictionary: Dictionary,
	key: string,
	params?: Record<string, string | number>
): string {
	const template = dictionary[key];
	if (template === undefined) {
		return key;
	}
	if (!params) return template;

	return template.replace(/\{(\w+)\}/g, (match, paramName: string) => {
		const value = params[paramName];
		return value !== undefined ? String(value) : match;
	});
}
