import type { Category } from './model'
import type { Tag } from '../tags/model'
import Icon from '../ui/Icon'
import CategoryIcon from './CategoryIcon'

interface Props {
  categories: Category[]
  selectedCategory: string
  selectedTag: string | null
  tags: Tag[]
  onCancel?(): void
  onClearTag?(): void
  onManageCategories?(): void
  onManageTags?(): void
  onSelectCategory?(category: Category): void
  onToggleTag?(tag: Tag): void
}

/** Lets the user choose a category and optional tag from a bottom sheet. */
export default function CategoryPickerDialog({
  categories,
  selectedCategory,
  selectedTag,
  tags,
  onCancel,
  onClearTag,
  onManageCategories,
  onManageTags,
  onSelectCategory,
  onToggleTag,
}: Props) {
  return <div className="category-picker-layer">
    <button aria-label="Close category picker" className="category-picker-scrim" onClick={onCancel} type="button" />
    <section aria-labelledby="category-picker-title" className="category-picker-dialog" role="dialog">
      <header>
        <h2 id="category-picker-title">Choose category / tag</h2>
        <button aria-label="Close" onClick={onCancel} type="button"><Icon name="close" size={27} /></button>
      </header>
      <div className="category-picker-tag-bar">
        <button aria-label="Clear tag" className={`category-picker-hash ${selectedTag ? '' : 'selected'}`} onClick={onClearTag} type="button">#</button>
        {tags.map((tag) => <button aria-pressed={selectedTag === tag.name} className="category-picker-tag" key={tag.id} onClick={() => onToggleTag?.(tag)} type="button">{tag.name}</button>)}
        <button className="category-picker-add-tag" onClick={onManageTags} type="button"><Icon name="plus" size={18} /> Add tag</button>
      </div>
      <div className="category-picker-scroll">
        <div className="category-picker-grid">
          {categories.map((category) => <button aria-label={category.name} aria-pressed={selectedCategory === category.name} key={category.id} onClick={() => onSelectCategory?.(category)} type="button">
            <span className="category-picker-icon"><CategoryIcon iconUrl={category.iconUrl} /></span>
            <span>{category.name}</span>
          </button>)}
        </div>
        <button className="category-picker-manage" onClick={onManageCategories} type="button"><Icon name="grid" size={24} /> Manage categories</button>
      </div>
    </section>
  </div>
}
