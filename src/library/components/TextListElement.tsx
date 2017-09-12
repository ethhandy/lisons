import * as React from "react"
import styled from "styled-components"

import { animations, colors, fonts } from "~/app/data/Style"
import { DeleteIcon } from "~/app/Icons"
import { Text } from "~/app/model"
import { AppStore } from "~/app/stores"
import { formatPercentage } from "~/util/FormatUtils"
import { withProps } from "~/util/StyleUtils"

export interface ITextListElementProps {
  readonly appStore: AppStore
  readonly text: Text
}
export function TextListElement({ appStore, text }: ITextListElementProps): JSX.Element {
  const progress = text.progress && text.progress.percentage > 0 && text.progress.percentage
  return (
    <Root key={text.id}>
      <Primary>
        <TitleAndAuthor>
          <Title onClick={() => appStore.showReaderScreen(text.id)}>{text.title}</Title>{" "}
          {text.author && <Author>{text.author}</Author>}
        </TitleAndAuthor>
        <span className="actions">
          <DeleteButton onClick={() => appStore.textStore.delete(text.id)} />
        </span>
      </Primary>
      <Secondary>
        <Languages>
          {text.contentLanguage.localName} 🡒 {text.translationLanguage.localName}
        </Languages>
        {progress && <Progress>{formatPercentage(progress)} read</Progress>}
      </Secondary>
    </Root>
  )
}

const Root = styled.li`
  padding: 0.75rem 0;
  .actions {
    opacity: 0;
    transition: opacity ${animations.std};
  }
  &:hover .actions {
    opacity: 1;
  }
`

const Primary = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const TitleAndAuthor = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.3rem;
  max-width: 40em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Title = styled.span`
  display: inline-block;
  max-width: 30em;
  margin-right: 0.5em;
  font: bold 1.1em ${fonts.serif};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover {
  }
`

const Author = styled.span`
  font-size: 0.9em;
  color: ${colors.primaryFade};
`

const Secondary = styled.div`
  display: flex;
  height: 1em;
`

const Languages = styled.span`
  font-style: italic;
  font-size: 0.8em;
  color: ${colors.primaryFade2};
`

const DeleteButton = withProps<{ onClick: () => void }>()(styled(DeleteIcon))`
  fill: ${colors.primaryFade};
  margin-left: 2rem;
  &:hover {
    fill: ${colors.danger};
    transition: fill ${animations.std};
  }
`

const Progress = styled.span`
  font-size: 0.9em;
  color: ${colors.primaryFade};
  margin-left: 2rem;
`
