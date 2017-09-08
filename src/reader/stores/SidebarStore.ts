import zip = require("lodash/zip")
import { action, observable, runInAction } from "mobx"

import { ILanguage } from "~/app/model"
import { emphasizePhrase, fetchSentences, ISentenceWithTranslations } from "~/app/Tatoeba"
import { hasSpace } from "~/util/StringUtils"

import { deeplTranslate, isLanguageConfigurationSupportedByDeepl } from "~/reader/DeeplTranslate"
import { googleTranslate } from "~/reader/GoogleTranslate"
import { IDictionaryEntry, ISources, ITranslation, ResourceState } from "~/reader/model"

type TranslationPair = [ITranslation | undefined, ITranslation | undefined]

export class SidebarStore {
  @observable public isVisible: boolean = true
  @observable public isMainTranslationLoading: boolean
  @observable.ref public exampleSentences: ISentenceWithTranslations[] = []
  @observable public exampleSentencesState: ResourceState = "NotLoading"
  @observable.ref public dictionaryEntries: IDictionaryEntry[] = []
  @observable public dictionaryEntriesState: ResourceState = "NotLoading"
  @observable public isSettingsTabActive: boolean
  @observable
  public sources: ISources = {
    translationSource: "Google",
    dictionarySource: "Google",
    sentencesSource: "Tatoeba"
  }

  @action
  public updateSources(contentLanguage: ILanguage, translationLanguage: ILanguage): void {
    const canDoDeeplTranslation = isLanguageConfigurationSupportedByDeepl(
      contentLanguage,
      translationLanguage
    )
    this.sources.translationSource = canDoDeeplTranslation ? "DeepL" : "Google"
  }

  public update = async (
    selectedText: string,
    contentLanguage: ILanguage,
    translationLanguage: ILanguage,
    translationCallback: (translation: string) => void
  ): Promise<void> => {
    if (!selectedText) {
      this.setResourcesNotLoading()
      return
    }

    this.setMainTranslationLoading()

    if (this.isVisible) {
      this.setDictionaryEntriesState("Loading")
      this.fetchExampleSentences(selectedText, contentLanguage, translationLanguage)
    }

    const [googleTranslation, deeplTranslation] = await this.fetchTranslations(
      selectedText,
      contentLanguage,
      translationLanguage
    )
    const mainTranslation = deeplTranslation || googleTranslation
    if (mainTranslation) {
      translationCallback(mainTranslation.full)
    }
    this.setMainTranslationLoading(false)

    if (this.isVisible) {
      runInAction(() => {
        this.dictionaryEntries = (googleTranslation && googleTranslation.dictionaryEntries) || []
        this.dictionaryEntriesState = "Loaded"
      })
    }
  }

  @action.bound
  public hide(): void {
    this.isVisible = false
    this.isSettingsTabActive = false
  }

  @action.bound
  public toggleSettings(): void {
    this.isVisible = true
    this.isSettingsTabActive = !this.isSettingsTabActive
  }

  @action
  public setVisible(value: boolean = true): void {
    this.isVisible = value
  }

  @action
  public setMainTranslationLoading(value: boolean = true): void {
    this.isMainTranslationLoading = value
  }

  @action
  public setSettingsTabActive(value: boolean = true): void {
    this.isSettingsTabActive = value
  }

  @action
  public setResourcesNotLoading(): void {
    this.exampleSentences = []
    this.exampleSentencesState = "NotLoading"
    this.dictionaryEntries = []
    this.dictionaryEntriesState = "NotLoading"
  }

  @action
  private setExampleSentencesState(value: ResourceState): void {
    this.exampleSentencesState = value
  }

  @action
  private setDictionaryEntriesState(value: ResourceState): void {
    this.dictionaryEntriesState = value
  }

  private async fetchExampleSentences(
    phrase: string,
    contentLanguage: ILanguage,
    translationLanguage: ILanguage
  ): Promise<void> {
    this.setExampleSentencesState("Loading")
    const exampleSentences = await fetchSentences(phrase, contentLanguage, translationLanguage)
    runInAction(() => {
      this.exampleSentences = exampleSentences.map(s => emphasizePhrase(phrase, s))
      this.exampleSentencesState = "Loaded"
    })
  }

  private async fetchTranslations(
    phrase: string,
    contentLanguage: ILanguage,
    translationLanguage: ILanguage
  ): Promise<TranslationPair> {
    const isSingleWord = !hasSpace(phrase)
    const canDoDeeplTranslation = this.sources.translationSource === "DeepL"

    const willDoGoogleTranslation = !canDoDeeplTranslation || isSingleWord
    const willDoDeeplTranslation =
      canDoDeeplTranslation && !(willDoGoogleTranslation && !this.isVisible)

    const translationPromises = zip<any>(
      [willDoGoogleTranslation, willDoDeeplTranslation],
      [googleTranslate, deeplTranslate]
    ).map(([condition, func]: [boolean, typeof googleTranslate]) => {
      if (condition) {
        return func(phrase, contentLanguage, translationLanguage)
      }
      return
    })

    return Promise.all(translationPromises) as Promise<TranslationPair>
  }
}