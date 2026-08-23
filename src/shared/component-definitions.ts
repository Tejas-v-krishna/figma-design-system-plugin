// Design System Kit - Component Definitions (90 components across 10 categories)
import { ComponentDefinition } from './types';

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // BUTTONS
  {
    name: 'Button',
    category: 'buttons',
    variants: [
      { name: 'Primary', properties: { variant: 'primary' } },
      { name: 'Secondary', properties: { variant: 'secondary' } },
      { name: 'Tonal', properties: { variant: 'tonal' } },
      { name: 'Ghost', properties: { variant: 'ghost' } },
      { name: 'Destructive', properties: { variant: 'destructive' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'xs', properties: { name: 'xs', height: 28, paddingX: 12, fontSize: 11 } },
      { name: 'sm', properties: { name: 'sm', height: 34, paddingX: 16, fontSize: 12 } },
      { name: 'md', properties: { name: 'md', height: 40, paddingX: 20, fontSize: 14 } },
      { name: 'lg', properties: { name: 'lg', height: 48, paddingX: 26, fontSize: 15 } },
      { name: 'xl', properties: { name: 'xl', height: 56, paddingX: 32, fontSize: 16 } },
    ],
    defaultProps: { variant: 'primary', state: 'default' },
  },
  {
    name: 'IconButton',
    category: 'buttons',
    variants: [
      { name: 'Primary', properties: { variant: 'primary' } },
      { name: 'Secondary', properties: { variant: 'secondary' } },
      { name: 'Tonal', properties: { variant: 'tonal' } },
      { name: 'Ghost', properties: { variant: 'ghost' } },
      { name: 'Destructive', properties: { variant: 'destructive' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', dimension: 32 } },
      { name: 'md', properties: { name: 'md', dimension: 40 } },
      { name: 'lg', properties: { name: 'lg', dimension: 48 } },
    ],
    defaultProps: { variant: 'primary', state: 'default' },
  },
  {
    name: 'ButtonGroup',
    category: 'buttons',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Connected', properties: { variant: 'connected' } },
      { name: 'Segmented', properties: { variant: 'segmented' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 32 } },
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'SegmentedControl',
    category: 'buttons',
    variants: [
      { name: 'Pill', properties: { variant: 'pill' } },
      { name: 'Rounded', properties: { variant: 'rounded' } },
      { name: 'Block', properties: { variant: 'block' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 32 } },
      { name: 'md', properties: { name: 'md', height: 38 } },
      { name: 'lg', properties: { name: 'lg', height: 44 } },
    ],
    defaultProps: { variant: 'pill', state: 'default' },
  },
  {
    name: 'SplitButton',
    category: 'buttons',
    variants: [
      { name: 'Primary', properties: { variant: 'primary' } },
      { name: 'Secondary', properties: { variant: 'secondary' } },
      { name: 'Tonal', properties: { variant: 'tonal' } },
      { name: 'Destructive', properties: { variant: 'destructive' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'primary', state: 'default' },
  },
  {
    name: 'FloatingActionButton',
    category: 'buttons',
    variants: [
      { name: 'Solid', properties: { variant: 'solid' } },
      { name: 'Extended', properties: { variant: 'extended' } },
      { name: 'Surface', properties: { variant: 'surface' } },
      { name: 'Tonal', properties: { variant: 'tonal' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', dimension: 40 } },
      { name: 'md', properties: { name: 'md', dimension: 48 } },
      { name: 'lg', properties: { name: 'lg', dimension: 56 } },
    ],
    defaultProps: { variant: 'solid', state: 'default' },
  },
  {
    name: 'SocialButton',
    category: 'buttons',
    variants: [
      { name: 'Google', properties: { variant: 'google' } },
      { name: 'Apple', properties: { variant: 'apple' } },
      { name: 'GitHub', properties: { variant: 'github' } },
      { name: 'Microsoft', properties: { variant: 'microsoft' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'google', state: 'default' },
  },
  {
    name: 'CopyButton',
    category: 'buttons',
    variants: [
      { name: 'Filled', properties: { variant: 'filled' } },
      { name: 'Bordered', properties: { variant: 'bordered' } },
      { name: 'Ghost', properties: { variant: 'ghost' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Copied', properties: { state: 'copied' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 32 } },
      { name: 'md', properties: { name: 'md', height: 38 } },
    ],
    defaultProps: { variant: 'filled', state: 'default' },
  },
  // INPUTS
  {
    name: 'Input',
    category: 'inputs',
    variants: [
      { name: 'Text', properties: { variant: 'text' } },
      { name: 'Dropdown', properties: { variant: 'dropdown' } },
      { name: 'Country', properties: { variant: 'country' } },
      { name: 'Email', properties: { variant: 'email' } },
      { name: 'Search', properties: { variant: 'search' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Success', properties: { state: 'success' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 36, fontSize: 12 } },
      { name: 'md', properties: { name: 'md', height: 44, fontSize: 14 } },
      { name: 'lg', properties: { name: 'lg', height: 52, fontSize: 15 } },
    ],
    defaultProps: { variant: 'text', state: 'default' },
  },
  {
    name: 'PasswordInput',
    category: 'inputs',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'StrengthMeter', properties: { variant: 'strengthmeter' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Revealed', properties: { state: 'revealed' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 44, fontSize: 14 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'SearchInput',
    category: 'inputs',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Pill', properties: { variant: 'pill' } },
      { name: 'WithShortcut', properties: { variant: 'withshortcut' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'WithResults', properties: { state: 'withresults' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 32 } },
      { name: 'md', properties: { name: 'md', height: 40 } },
      { name: 'lg', properties: { name: 'lg', height: 48 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'NumberInput',
    category: 'inputs',
    variants: [
      { name: 'Standard', properties: { variant: 'standard' } },
      { name: 'SteppersRight', properties: { variant: 'steppersright' } },
      { name: 'SteppersSides', properties: { variant: 'stepperssides' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'standard', state: 'default' },
  },
  {
    name: 'CurrencyInput',
    category: 'inputs',
    variants: [
      { name: 'USD', properties: { variant: 'usd' } },
      { name: 'EUR', properties: { variant: 'eur' } },
      { name: 'GBP', properties: { variant: 'gbp' } },
      { name: 'INR', properties: { variant: 'inr' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'usd', state: 'default' },
  },
  {
    name: 'PhoneInput',
    category: 'inputs',
    variants: [
      { name: 'WithFlagDropdown', properties: { variant: 'withflagdropdown' } },
      { name: 'SimplePrefix', properties: { variant: 'simpleprefix' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'withflagdropdown', state: 'default' },
  },
  {
    name: 'PinInput',
    category: 'inputs',
    variants: [
      { name: '4-Digit', properties: { variant: '4-digit' } },
      { name: '6-Digit', properties: { variant: '6-digit' } },
      { name: 'Masked', properties: { variant: 'masked' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Filled', properties: { state: 'filled' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 44, dimension: 44 } },
    ],
    defaultProps: { variant: '4-digit', state: 'default' },
  },
  {
    name: 'Textarea',
    category: 'inputs',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'AutoResize', properties: { variant: 'autoresize' } },
      { name: 'WithCounter', properties: { variant: 'withcounter' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Error', properties: { state: 'error' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', minHeight: 70 } },
      { name: 'md', properties: { name: 'md', minHeight: 96 } },
      { name: 'lg', properties: { name: 'lg', minHeight: 120 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'RichTextEditor',
    category: 'inputs',
    variants: [
      { name: 'StandardToolbar', properties: { variant: 'standardtoolbar' } },
      { name: 'CompactFloating', properties: { variant: 'compactfloating' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', minHeight: 140 } },
    ],
    defaultProps: { variant: 'standardtoolbar', state: 'default' },
  },
  {
    name: 'TagInput',
    category: 'inputs',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'PillTags', properties: { variant: 'pilltags' } },
      { name: 'ColoredTags', properties: { variant: 'coloredtags' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 44 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  // FORMS
  {
    name: 'Checkbox',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithDescription', properties: { variant: 'withdescription' } },
      { name: 'Card', properties: { variant: 'card' } },
    ],
    states: [
      { name: 'Unchecked', properties: { state: 'unchecked' } },
      { name: 'Checked', properties: { state: 'checked' } },
      { name: 'Indeterminate', properties: { state: 'indeterminate' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', dimension: 16 } },
      { name: 'md', properties: { name: 'md', dimension: 20 } },
      { name: 'lg', properties: { name: 'lg', dimension: 24 } },
    ],
    defaultProps: { variant: 'default', state: 'unchecked' },
  },
  {
    name: 'CheckboxGroup',
    category: 'forms',
    variants: [
      { name: 'Vertical', properties: { variant: 'vertical' } },
      { name: 'Horizontal', properties: { variant: 'horizontal' } },
      { name: 'CardGrid', properties: { variant: 'cardgrid' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'vertical', state: 'default' },
  },
  {
    name: 'Radio',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithDescription', properties: { variant: 'withdescription' } },
    ],
    states: [
      { name: 'Unselected', properties: { state: 'unselected' } },
      { name: 'Selected', properties: { state: 'selected' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', dimension: 16 } },
      { name: 'md', properties: { name: 'md', dimension: 20 } },
      { name: 'lg', properties: { name: 'lg', dimension: 24 } },
    ],
    defaultProps: { variant: 'default', state: 'unselected' },
  },
  {
    name: 'RadioCard',
    category: 'forms',
    variants: [
      { name: 'Simple', properties: { variant: 'simple' } },
      { name: 'WithIcon', properties: { variant: 'withicon' } },
      { name: 'WithPrice', properties: { variant: 'withprice' } },
    ],
    states: [
      { name: 'Unselected', properties: { state: 'unselected' } },
      { name: 'Selected', properties: { state: 'selected' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', minHeight: 80 } },
    ],
    defaultProps: { variant: 'simple', state: 'unselected' },
  },
  {
    name: 'Switch',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithIcons', properties: { variant: 'withicons' } },
      { name: 'WithLabel', properties: { variant: 'withlabel' } },
    ],
    states: [
      { name: 'Off', properties: { state: 'off' } },
      { name: 'On', properties: { state: 'on' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 20, width: 36 } },
      { name: 'md', properties: { name: 'md', height: 24, width: 44 } },
      { name: 'lg', properties: { name: 'lg', height: 30, width: 54 } },
    ],
    defaultProps: { variant: 'default', state: 'off' },
  },
  {
    name: 'Slider',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithTooltip', properties: { variant: 'withtooltip' } },
      { name: 'WithLabels', properties: { variant: 'withlabels' } },
      { name: 'Stepped', properties: { variant: 'stepped' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 24 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'RangeSlider',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithTooltip', properties: { variant: 'withtooltip' } },
      { name: 'WithMinMaxInputs', properties: { variant: 'withminmaxinputs' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 24 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'Rating',
    category: 'forms',
    variants: [
      { name: 'Stars', properties: { variant: 'stars' } },
      { name: 'Hearts', properties: { variant: 'hearts' } },
      { name: 'Emojis', properties: { variant: 'emojis' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
      { name: 'ReadOnly', properties: { state: 'readonly' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', dimension: 16 } },
      { name: 'md', properties: { name: 'md', dimension: 22 } },
      { name: 'lg', properties: { name: 'lg', dimension: 28 } },
    ],
    defaultProps: { variant: 'stars', state: 'default' },
  },
  {
    name: 'Select',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithIcons', properties: { variant: 'withicons' } },
      { name: 'Searchable', properties: { variant: 'searchable' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Open', properties: { state: 'open' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 32 } },
      { name: 'md', properties: { name: 'md', height: 40 } },
      { name: 'lg', properties: { name: 'lg', height: 48 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'MultiSelect',
    category: 'forms',
    variants: [
      { name: 'TagPills', properties: { variant: 'tagpills' } },
      { name: 'CheckboxDropdown', properties: { variant: 'checkboxdropdown' } },
      { name: 'CountSummary', properties: { variant: 'countsummary' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 42 } },
    ],
    defaultProps: { variant: 'tagpills', state: 'default' },
  },
  {
    name: 'Cascader',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'HoverTrigger', properties: { variant: 'hovertrigger' } },
      { name: 'Searchable', properties: { variant: 'searchable' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'Autocomplete',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithCategoryGrouping', properties: { variant: 'withcategorygrouping' } },
      { name: 'HighlightMatch', properties: { variant: 'highlightmatch' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'TreeSelect',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'MultiCheck', properties: { variant: 'multicheck' } },
      { name: 'Searchable', properties: { variant: 'searchable' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'ColorPicker',
    category: 'forms',
    variants: [
      { name: 'PaletteGrid', properties: { variant: 'palettegrid' } },
      { name: 'GradientWheel', properties: { variant: 'gradientwheel' } },
      { name: 'CompactHex', properties: { variant: 'compacthex' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 240 } },
    ],
    defaultProps: { variant: 'palettegrid', state: 'default' },
  },
  {
    name: 'DatePicker',
    category: 'forms',
    variants: [
      { name: 'SingleDate', properties: { variant: 'singledate' } },
      { name: 'WithTime', properties: { variant: 'withtime' } },
      { name: 'MonthPicker', properties: { variant: 'monthpicker' } },
      { name: 'YearPicker', properties: { variant: 'yearpicker' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'singledate', state: 'default' },
  },
  {
    name: 'DateRangePicker',
    category: 'forms',
    variants: [
      { name: 'DualCalendar', properties: { variant: 'dualcalendar' } },
      { name: 'PresetRanges', properties: { variant: 'presetranges' } },
      { name: 'CompactPopover', properties: { variant: 'compactpopover' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'dualcalendar', state: 'default' },
  },
  // FEEDBACK
  {
    name: 'Alert',
    category: 'feedback',
    variants: [
      { name: 'Info', properties: { variant: 'info' } },
      { name: 'Success', properties: { variant: 'success' } },
      { name: 'Warning', properties: { variant: 'warning' } },
      { name: 'Error', properties: { variant: 'error' } },
      { name: 'Neutral', properties: { variant: 'neutral' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'WithCloseButton', properties: { state: 'withclosebutton' } },
      { name: 'WithAction', properties: { state: 'withaction' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', paddingY: 10 } },
      { name: 'md', properties: { name: 'md', paddingY: 14 } },
    ],
    defaultProps: { variant: 'info', state: 'default' },
  },
  {
    name: 'Badge',
    category: 'feedback',
    variants: [
      { name: 'Solid', properties: { variant: 'solid' } },
      { name: 'Soft', properties: { variant: 'soft' } },
      { name: 'Outline', properties: { variant: 'outline' } },
      { name: 'Dot', properties: { variant: 'dot' } },
    ],
    states: [
      { name: 'Primary', properties: { state: 'primary' } },
      { name: 'Success', properties: { state: 'success' } },
      { name: 'Warning', properties: { state: 'warning' } },
      { name: 'Error', properties: { state: 'error' } },
      { name: 'Neutral', properties: { state: 'neutral' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 20 } },
      { name: 'md', properties: { name: 'md', height: 24 } },
      { name: 'lg', properties: { name: 'lg', height: 28 } },
    ],
    defaultProps: { variant: 'solid', state: 'primary' },
  },
  {
    name: 'Tag',
    category: 'feedback',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Pill', properties: { variant: 'pill' } },
      { name: 'WithAvatar', properties: { variant: 'withavatar' } },
      { name: 'Removable', properties: { variant: 'removable' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Selected', properties: { state: 'selected' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 24 } },
      { name: 'md', properties: { name: 'md', height: 30 } },
    ],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'Toast',
    category: 'feedback',
    variants: [
      { name: 'Info', properties: { variant: 'info' } },
      { name: 'Success', properties: { variant: 'success' } },
      { name: 'Warning', properties: { variant: 'warning' } },
      { name: 'Error', properties: { variant: 'error' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'WithProgressBar', properties: { state: 'withprogressbar' } },
      { name: 'ActionCTA', properties: { state: 'actioncta' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 340 } },
    ],
    defaultProps: { variant: 'info', state: 'default' },
  },
  {
    name: 'Banner',
    category: 'feedback',
    variants: [
      { name: 'Announcement', properties: { variant: 'announcement' } },
      { name: 'CriticalAlert', properties: { variant: 'criticalalert' } },
      { name: 'StickyPromo', properties: { variant: 'stickypromo' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Dismissible', properties: { state: 'dismissible' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 48 } },
    ],
    defaultProps: { variant: 'announcement', state: 'default' },
  },
  {
    name: 'ProgressBar',
    category: 'feedback',
    variants: [
      { name: 'Linear', properties: { variant: 'linear' } },
      { name: 'Striped', properties: { variant: 'striped' } },
      { name: 'WithPercentage', properties: { variant: 'withpercentage' } },
      { name: 'Indeterminate', properties: { variant: 'indeterminate' } },
    ],
    states: [
      { name: 'Primary', properties: { state: 'primary' } },
      { name: 'Success', properties: { state: 'success' } },
      { name: 'Warning', properties: { state: 'warning' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 4 } },
      { name: 'md', properties: { name: 'md', height: 8 } },
      { name: 'lg', properties: { name: 'lg', height: 12 } },
    ],
    defaultProps: { variant: 'linear', state: 'primary' },
  },
  {
    name: 'ProgressCircle',
    category: 'feedback',
    variants: [
      { name: 'Standard', properties: { variant: 'standard' } },
      { name: 'WithMetricInside', properties: { variant: 'withmetricinside' } },
      { name: 'DashboardGauge', properties: { variant: 'dashboardgauge' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Success', properties: { state: 'success' } },
      { name: 'Warning', properties: { state: 'warning' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', dimension: 40 } },
      { name: 'md', properties: { name: 'md', dimension: 64 } },
      { name: 'lg', properties: { name: 'lg', dimension: 96 } },
    ],
    defaultProps: { variant: 'standard', state: 'default' },
  },
  {
    name: 'Spinner',
    category: 'feedback',
    variants: [
      { name: 'Circular', properties: { variant: 'circular' } },
      { name: 'DotsBounce', properties: { variant: 'dotsbounce' } },
      { name: 'PulseRing', properties: { variant: 'pulsering' } },
    ],
    states: [
      { name: 'Primary', properties: { state: 'primary' } },
      { name: 'Neutral', properties: { state: 'neutral' } },
      { name: 'White', properties: { state: 'white' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', dimension: 16 } },
      { name: 'md', properties: { name: 'md', dimension: 24 } },
      { name: 'lg', properties: { name: 'lg', dimension: 36 } },
    ],
    defaultProps: { variant: 'circular', state: 'primary' },
  },
  {
    name: 'Skeleton',
    category: 'feedback',
    variants: [
      { name: 'TextLine', properties: { variant: 'textline' } },
      { name: 'AvatarCircle', properties: { variant: 'avatarcircle' } },
      { name: 'CardBlock', properties: { variant: 'cardblock' } },
      { name: 'ButtonBox', properties: { variant: 'buttonbox' } },
    ],
    states: [
      { name: 'PulseAnimation', properties: { state: 'pulseanimation' } },
      { name: 'WaveShimmer', properties: { state: 'waveshimmer' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'textline', state: 'pulseanimation' },
  },
  {
    name: 'EmptyState',
    category: 'feedback',
    variants: [
      { name: 'NoData', properties: { variant: 'nodata' } },
      { name: 'SearchNotFound', properties: { variant: 'searchnotfound' } },
      { name: 'Error404', properties: { variant: 'error404' } },
      { name: 'SuccessDone', properties: { variant: 'successdone' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Compact', properties: { state: 'compact' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', minHeight: 220 } },
    ],
    defaultProps: { variant: 'nodata', state: 'default' },
  },
  // NAVIGATION
  {
    name: 'Tabs',
    category: 'navigation',
    variants: [
      { name: 'Underline', properties: { variant: 'underline' } },
      { name: 'PillCapsule', properties: { variant: 'pillcapsule' } },
      { name: 'SegmentedBox', properties: { variant: 'segmentedbox' } },
      { name: 'VerticalSidebar', properties: { variant: 'verticalsidebar' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 32 } },
      { name: 'md', properties: { name: 'md', height: 40 } },
    ],
    defaultProps: { variant: 'underline', state: 'default' },
  },
  {
    name: 'Breadcrumb',
    category: 'navigation',
    variants: [
      { name: 'SlashSeparator', properties: { variant: 'slashseparator' } },
      { name: 'ChevronSeparator', properties: { variant: 'chevronseparator' } },
      { name: 'DotSeparator', properties: { variant: 'dotseparator' } },
      { name: 'WithIcons', properties: { variant: 'withicons' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Collapsed', properties: { state: 'collapsed' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', fontSize: 13 } },
    ],
    defaultProps: { variant: 'slashseparator', state: 'default' },
  },
  {
    name: 'Pagination',
    category: 'navigation',
    variants: [
      { name: 'StandardNumbers', properties: { variant: 'standardnumbers' } },
      { name: 'MinimalArrows', properties: { variant: 'minimalarrows' } },
      { name: 'JumpToPageInput', properties: { variant: 'jumptopageinput' } },
      { name: 'SimpleNextPrev', properties: { variant: 'simplenextprev' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 32 } },
      { name: 'md', properties: { name: 'md', height: 38 } },
    ],
    defaultProps: { variant: 'standardnumbers', state: 'default' },
  },
  {
    name: 'Navbar',
    category: 'navigation',
    variants: [
      { name: 'SimpleLinks', properties: { variant: 'simplelinks' } },
      { name: 'SearchCentered', properties: { variant: 'searchcentered' } },
      { name: 'MegaMenuTrigger', properties: { variant: 'megamenutrigger' } },
      { name: 'SaaSAppHeader', properties: { variant: 'saasappheader' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'StickyScrolled', properties: { state: 'stickyscrolled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 64 } },
    ],
    defaultProps: { variant: 'simplelinks', state: 'default' },
  },
  {
    name: 'Sidebar',
    category: 'navigation',
    variants: [
      { name: 'Expanded', properties: { variant: 'expanded' } },
      { name: 'CollapsedIconsOnly', properties: { variant: 'collapsediconsonly' } },
      { name: 'DarkObsidian', properties: { variant: 'darkobsidian' } },
      { name: 'LightBordered', properties: { variant: 'lightbordered' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
    ],
    sizes: [
      { name: 'expanded', properties: { name: 'expanded', width: 240 } },
      { name: 'collapsed', properties: { name: 'collapsed', width: 68 } },
    ],
    defaultProps: { variant: 'expanded', state: 'default' },
  },
  {
    name: 'NavMenu',
    category: 'navigation',
    variants: [
      { name: 'HorizontalDropdown', properties: { variant: 'horizontaldropdown' } },
      { name: 'MultiColumnFlyout', properties: { variant: 'multicolumnflyout' } },
      { name: 'IconListMenu', properties: { variant: 'iconlistmenu' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'horizontaldropdown', state: 'default' },
  },
  {
    name: 'Stepper',
    category: 'navigation',
    variants: [
      { name: 'HorizontalLine', properties: { variant: 'horizontalline' } },
      { name: 'VerticalTimeline', properties: { variant: 'verticaltimeline' } },
      { name: 'NumberedCircles', properties: { variant: 'numberedcircles' } },
      { name: 'SimpleDots', properties: { variant: 'simpledots' } },
    ],
    states: [
      { name: 'Completed', properties: { state: 'completed' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Upcoming', properties: { state: 'upcoming' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 48 } },
    ],
    defaultProps: { variant: 'horizontalline', state: 'completed' },
  },
  {
    name: 'PaginationDots',
    category: 'navigation',
    variants: [
      { name: 'CircularDots', properties: { variant: 'circulardots' } },
      { name: 'ActiveElongatedPill', properties: { variant: 'activeelongatedpill' } },
      { name: 'DashedLine', properties: { variant: 'dashedline' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 12 } },
    ],
    defaultProps: { variant: 'circulardots', state: 'default' },
  },
  {
    name: 'BackToTop',
    category: 'navigation',
    variants: [
      { name: 'CircleElevated', properties: { variant: 'circleelevated' } },
      { name: 'PillWithText', properties: { variant: 'pillwithtext' } },
      { name: 'MinimalGhost', properties: { variant: 'minimalghost' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', dimension: 44 } },
    ],
    defaultProps: { variant: 'circleelevated', state: 'default' },
  },
  {
    name: 'AnchorNav',
    category: 'navigation',
    variants: [
      { name: 'LeftBorderLine', properties: { variant: 'leftborderline' } },
      { name: 'PillHighlights', properties: { variant: 'pillhighlights' } },
      { name: 'MinimalHierarchy', properties: { variant: 'minimalhierarchy' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Active', properties: { state: 'active' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'leftborderline', state: 'default' },
  },
  // CARDS
  {
    name: 'Card',
    category: 'cards',
    variants: [
      { name: 'Elevated', properties: { variant: 'elevated' } },
      { name: 'Outlined', properties: { variant: 'outlined' } },
      { name: 'FilledMuted', properties: { variant: 'filledmuted' } },
      { name: 'InteractiveHover', properties: { variant: 'interactivehover' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Selected', properties: { state: 'selected' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 340 } },
    ],
    defaultProps: { variant: 'elevated', state: 'default' },
  },
  {
    name: 'ProfileCard',
    category: 'cards',
    variants: [
      { name: 'StandardUser', properties: { variant: 'standarduser' } },
      { name: 'CompactHorizontal', properties: { variant: 'compacthorizontal' } },
      { name: 'EditorialCreator', properties: { variant: 'editorialcreator' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Following', properties: { state: 'following' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 320 } },
    ],
    defaultProps: { variant: 'standarduser', state: 'default' },
  },
  {
    name: 'MetricCard',
    category: 'cards',
    variants: [
      { name: 'StatTrend', properties: { variant: 'stattrend' } },
      { name: 'StatSparkline', properties: { variant: 'statsparkline' } },
      { name: 'StatProgress', properties: { variant: 'statprogress' } },
      { name: 'Comparison', properties: { variant: 'comparison' } },
    ],
    states: [
      { name: 'PositiveTrend', properties: { state: 'positivetrend' } },
      { name: 'NegativeTrend', properties: { state: 'negativetrend' } },
      { name: 'Neutral', properties: { state: 'neutral' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', minHeight: 120 } },
    ],
    defaultProps: { variant: 'stattrend', state: 'positivetrend' },
  },
  {
    name: 'PricingCard',
    category: 'cards',
    variants: [
      { name: 'StandardTier', properties: { variant: 'standardtier' } },
      { name: 'PopularFeatured', properties: { variant: 'popularfeatured' } },
      { name: 'EnterpriseContact', properties: { variant: 'enterprisecontact' } },
    ],
    states: [
      { name: 'MonthlyBilling', properties: { state: 'monthlybilling' } },
      { name: 'AnnualDiscount', properties: { state: 'annualdiscount' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 300 } },
    ],
    defaultProps: { variant: 'standardtier', state: 'monthlybilling' },
  },
  {
    name: 'BentoCard',
    category: 'cards',
    variants: [
      { name: 'EditorialClean', properties: { variant: 'editorialclean' } },
      { name: 'DarkContrast', properties: { variant: 'darkcontrast' } },
      { name: 'FeatureShowcase', properties: { variant: 'featureshowcase' } },
      { name: 'StatsGrid', properties: { variant: 'statsgrid' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'HoverGlow', properties: { state: 'hoverglow' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 180 } },
      { name: 'md', properties: { name: 'md', height: 260 } },
      { name: 'lg', properties: { name: 'lg', height: 360 } },
    ],
    defaultProps: { variant: 'editorialclean', state: 'default' },
  },
  {
    name: 'ProductCard',
    category: 'cards',
    variants: [
      { name: 'ECommerceStandard', properties: { variant: 'ecommercestandard' } },
      { name: 'HorizontalListItem', properties: { variant: 'horizontallistitem' } },
      { name: 'MinimalCover', properties: { variant: 'minimalcover' } },
    ],
    states: [
      { name: 'InStock', properties: { state: 'instock' } },
      { name: 'OnSale', properties: { state: 'onsale' } },
      { name: 'OutOfStock', properties: { state: 'outofstock' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 280 } },
    ],
    defaultProps: { variant: 'ecommercestandard', state: 'instock' },
  },
  {
    name: 'ReviewCard',
    category: 'cards',
    variants: [
      { name: 'TestimonialQuote', properties: { variant: 'testimonialquote' } },
      { name: 'ProductReviewItem', properties: { variant: 'productreviewitem' } },
      { name: 'CompactTweet', properties: { variant: 'compacttweet' } },
    ],
    states: [
      { name: 'VerifiedBuyer', properties: { state: 'verifiedbuyer' } },
      { name: 'Default', properties: { state: 'default' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', minHeight: 140 } },
    ],
    defaultProps: { variant: 'testimonialquote', state: 'verifiedbuyer' },
  },
  {
    name: 'Accordion',
    category: 'cards',
    variants: [
      { name: 'BorderedSeparated', properties: { variant: 'borderedseparated' } },
      { name: 'FlushClean', properties: { variant: 'flushclean' } },
      { name: 'ContainedCards', properties: { variant: 'containedcards' } },
    ],
    states: [
      { name: 'Collapsed', properties: { state: 'collapsed' } },
      { name: 'Expanded', properties: { state: 'expanded' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', minHeight: 52 } },
    ],
    defaultProps: { variant: 'borderedseparated', state: 'collapsed' },
  },
  {
    name: 'Collapsible',
    category: 'cards',
    variants: [
      { name: 'SimpleDisclosure', properties: { variant: 'simpledisclosure' } },
      { name: 'CardContainer', properties: { variant: 'cardcontainer' } },
    ],
    states: [
      { name: 'Closed', properties: { state: 'closed' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'simpledisclosure', state: 'closed' },
  },
  {
    name: 'Timeline',
    category: 'cards',
    variants: [
      { name: 'VerticalLine', properties: { variant: 'verticalline' } },
      { name: 'OppositeContent', properties: { variant: 'oppositecontent' } },
      { name: 'HorizontalRoadmap', properties: { variant: 'horizontalroadmap' } },
    ],
    states: [
      { name: 'CompletedStep', properties: { state: 'completedstep' } },
      { name: 'CurrentStep', properties: { state: 'currentstep' } },
      { name: 'UpcomingStep', properties: { state: 'upcomingstep' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'verticalline', state: 'completedstep' },
  },
  // DATA-DISPLAY
  {
    name: 'Table',
    category: 'data-display',
    variants: [
      { name: 'StandardBordered', properties: { variant: 'standardbordered' } },
      { name: 'StripedZebra', properties: { variant: 'stripedzebra' } },
      { name: 'CompactDense', properties: { variant: 'compactdense' } },
      { name: 'InteractiveRows', properties: { variant: 'interactiverows' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'HoverRow', properties: { state: 'hoverrow' } },
      { name: 'SelectedRow', properties: { state: 'selectedrow' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 800 } },
    ],
    defaultProps: { variant: 'standardbordered', state: 'default' },
  },
  {
    name: 'DataList',
    category: 'data-display',
    variants: [
      { name: 'HorizontalInline', properties: { variant: 'horizontalinline' } },
      { name: 'VerticalStacked', properties: { variant: 'verticalstacked' } },
      { name: 'TwoColumnGrid', properties: { variant: 'twocolumngrid' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'horizontalinline', state: 'default' },
  },
  {
    name: 'Avatar',
    category: 'data-display',
    variants: [
      { name: 'Image', properties: { variant: 'image' } },
      { name: 'InitialsText', properties: { variant: 'initialstext' } },
      { name: 'IconFallback', properties: { variant: 'iconfallback' } },
      { name: 'AnonymousSilhouette', properties: { variant: 'anonymoussilhouette' } },
    ],
    states: [
      { name: 'Online', properties: { state: 'online' } },
      { name: 'Offline', properties: { state: 'offline' } },
      { name: 'Busy', properties: { state: 'busy' } },
      { name: 'Away', properties: { state: 'away' } },
    ],
    sizes: [
      { name: 'xs', properties: { name: 'xs', dimension: 24 } },
      { name: 'sm', properties: { name: 'sm', dimension: 32 } },
      { name: 'md', properties: { name: 'md', dimension: 40 } },
      { name: 'lg', properties: { name: 'lg', dimension: 52 } },
      { name: 'xl', properties: { name: 'xl', dimension: 64 } },
    ],
    defaultProps: { variant: 'image', state: 'online' },
  },
  {
    name: 'AvatarGroup',
    category: 'data-display',
    variants: [
      { name: 'StackedOverlap', properties: { variant: 'stackedoverlap' } },
      { name: 'CompactGrid', properties: { variant: 'compactgrid' } },
      { name: 'WithCountBadge', properties: { variant: 'withcountbadge' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'HoverExpand', properties: { state: 'hoverexpand' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', dimension: 28 } },
      { name: 'md', properties: { name: 'md', dimension: 36 } },
    ],
    defaultProps: { variant: 'stackedoverlap', state: 'default' },
  },
  {
    name: 'Tooltip',
    category: 'data-display',
    variants: [
      { name: 'DarkTooltip', properties: { variant: 'darktooltip' } },
      { name: 'LightBordered', properties: { variant: 'lightbordered' } },
      { name: 'WithArrow', properties: { variant: 'witharrow' } },
      { name: 'RichActionTooltip', properties: { variant: 'richactiontooltip' } },
    ],
    states: [
      { name: 'Top', properties: { state: 'top' } },
      { name: 'Right', properties: { state: 'right' } },
      { name: 'Bottom', properties: { state: 'bottom' } },
      { name: 'Left', properties: { state: 'left' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', fontSize: 11 } },
      { name: 'md', properties: { name: 'md', fontSize: 12 } },
    ],
    defaultProps: { variant: 'darktooltip', state: 'top' },
  },
  {
    name: 'Popover',
    category: 'data-display',
    variants: [
      { name: 'StandardCard', properties: { variant: 'standardcard' } },
      { name: 'MenuActions', properties: { variant: 'menuactions' } },
      { name: 'FormMiniCard', properties: { variant: 'formminicard' } },
    ],
    states: [
      { name: 'Top', properties: { state: 'top' } },
      { name: 'Right', properties: { state: 'right' } },
      { name: 'Bottom', properties: { state: 'bottom' } },
      { name: 'Left', properties: { state: 'left' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 260 } },
    ],
    defaultProps: { variant: 'standardcard', state: 'top' },
  },
  {
    name: 'Statistic',
    category: 'data-display',
    variants: [
      { name: 'LargeMetric', properties: { variant: 'largemetric' } },
      { name: 'WithIconPrefix', properties: { variant: 'withiconprefix' } },
      { name: 'ComparisonDelta', properties: { variant: 'comparisondelta' } },
      { name: 'CompactBadge', properties: { variant: 'compactbadge' } },
    ],
    states: [
      { name: 'Positive', properties: { state: 'positive' } },
      { name: 'Negative', properties: { state: 'negative' } },
      { name: 'Neutral', properties: { state: 'neutral' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', fontSize: 28 } },
    ],
    defaultProps: { variant: 'largemetric', state: 'positive' },
  },
  {
    name: 'Kbd',
    category: 'data-display',
    variants: [
      { name: 'CommandKey', properties: { variant: 'commandkey' } },
      { name: 'ShiftKey', properties: { variant: 'shiftkey' } },
      { name: 'OptionKey', properties: { variant: 'optionkey' } },
      { name: 'KeyComboGroup', properties: { variant: 'keycombogroup' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'ActivePressed', properties: { state: 'activepressed' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', height: 20 } },
      { name: 'md', properties: { name: 'md', height: 24 } },
    ],
    defaultProps: { variant: 'commandkey', state: 'default' },
  },
  {
    name: 'Tree',
    category: 'data-display',
    variants: [
      { name: 'FolderDirectory', properties: { variant: 'folderdirectory' } },
      { name: 'FilterCheckboxTree', properties: { variant: 'filtercheckboxtree' } },
      { name: 'NavigationHierarchy', properties: { variant: 'navigationhierarchy' } },
    ],
    states: [
      { name: 'Collapsed', properties: { state: 'collapsed' } },
      { name: 'Expanded', properties: { state: 'expanded' } },
      { name: 'SelectedNode', properties: { state: 'selectednode' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'folderdirectory', state: 'collapsed' },
  },
  {
    name: 'CodeBlock',
    category: 'data-display',
    variants: [
      { name: 'SyntaxDark', properties: { variant: 'syntaxdark' } },
      { name: 'SyntaxLight', properties: { variant: 'syntaxlight' } },
      { name: 'WithLineNumbers', properties: { variant: 'withlinenumbers' } },
      { name: 'TerminalWindow', properties: { variant: 'terminalwindow' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'CopiedCode', properties: { state: 'copiedcode' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', minHeight: 120 } },
    ],
    defaultProps: { variant: 'syntaxdark', state: 'default' },
  },
  // OVERLAYS
  {
    name: 'Modal',
    category: 'overlays',
    variants: [
      { name: 'ConfirmationDialog', properties: { variant: 'confirmationdialog' } },
      { name: 'FormModal', properties: { variant: 'formmodal' } },
      { name: 'LargeContent', properties: { variant: 'largecontent' } },
      { name: 'FullscreenTakeover', properties: { variant: 'fullscreentakeover' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'WithHeaderActions', properties: { state: 'withheaderactions' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', width: 400 } },
      { name: 'md', properties: { name: 'md', width: 560 } },
      { name: 'lg', properties: { name: 'lg', width: 720 } },
    ],
    defaultProps: { variant: 'confirmationdialog', state: 'default' },
  },
  {
    name: 'Drawer',
    category: 'overlays',
    variants: [
      { name: 'RightSideSheet', properties: { variant: 'rightsidesheet' } },
      { name: 'LeftSideNav', properties: { variant: 'leftsidenav' } },
      { name: 'TopBannerDrawer', properties: { variant: 'topbannerdrawer' } },
      { name: 'BottomPanel', properties: { variant: 'bottompanel' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'WithFooterCTA', properties: { state: 'withfootercta' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', width: 340 } },
      { name: 'md', properties: { name: 'md', width: 480 } },
      { name: 'lg', properties: { name: 'lg', width: 640 } },
    ],
    defaultProps: { variant: 'rightsidesheet', state: 'default' },
  },
  {
    name: 'BottomSheet',
    category: 'overlays',
    variants: [
      { name: 'MobileActionSheet', properties: { variant: 'mobileactionsheet' } },
      { name: 'ExpandableCard', properties: { variant: 'expandablecard' } },
      { name: 'GrabHandleSnap', properties: { variant: 'grabhandlesnap' } },
    ],
    states: [
      { name: 'HalfExpanded', properties: { state: 'halfexpanded' } },
      { name: 'FullExpanded', properties: { state: 'fullexpanded' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 320 } },
    ],
    defaultProps: { variant: 'mobileactionsheet', state: 'halfexpanded' },
  },
  {
    name: 'AlertDialog',
    category: 'overlays',
    variants: [
      { name: 'DestructiveDelete', properties: { variant: 'destructivedelete' } },
      { name: 'WarningNotice', properties: { variant: 'warningnotice' } },
      { name: 'SessionExpired', properties: { variant: 'sessionexpired' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
    ],
    sizes: [
      { name: 'sm', properties: { name: 'sm', width: 420 } },
    ],
    defaultProps: { variant: 'destructivedelete', state: 'default' },
  },
  {
    name: 'ContextMenu',
    category: 'overlays',
    variants: [
      { name: 'ActionList', properties: { variant: 'actionlist' } },
      { name: 'WithShortcutsAndIcons', properties: { variant: 'withshortcutsandicons' } },
      { name: 'GroupedDividers', properties: { variant: 'groupeddividers' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'HoverItem', properties: { state: 'hoveritem' } },
      { name: 'DisabledItem', properties: { state: 'disableditem' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 220 } },
    ],
    defaultProps: { variant: 'actionlist', state: 'default' },
  },
  {
    name: 'CommandMenu',
    category: 'overlays',
    variants: [
      { name: 'PaletteSearch', properties: { variant: 'palettesearch' } },
      { name: 'WithCategoryHeaders', properties: { variant: 'withcategoryheaders' } },
      { name: 'RecentSearches', properties: { variant: 'recentsearches' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'SelectedItem', properties: { state: 'selecteditem' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 560, height: 360 } },
    ],
    defaultProps: { variant: 'palettesearch', state: 'default' },
  },
  {
    name: 'Lightbox',
    category: 'overlays',
    variants: [
      { name: 'SingleImage', properties: { variant: 'singleimage' } },
      { name: 'GalleryCarousel', properties: { variant: 'gallerycarousel' } },
      { name: 'VideoPlayerModal', properties: { variant: 'videoplayermodal' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Zoomed', properties: { state: 'zoomed' } },
    ],
    sizes: [
      { name: 'fullscreen', properties: { name: 'fullscreen', width: 800, height: 500 } },
    ],
    defaultProps: { variant: 'singleimage', state: 'default' },
  },
  {
    name: 'CookieBanner',
    category: 'overlays',
    variants: [
      { name: 'FloatingBottomCard', properties: { variant: 'floatingbottomcard' } },
      { name: 'FullWidthBar', properties: { variant: 'fullwidthbar' } },
      { name: 'DetailedPreferencesModal', properties: { variant: 'detailedpreferencesmodal' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Customizing', properties: { state: 'customizing' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 480 } },
    ],
    defaultProps: { variant: 'floatingbottomcard', state: 'default' },
  },
  // MEDIA
  {
    name: 'FileUploader',
    category: 'media',
    variants: [
      { name: 'DragDropZone', properties: { variant: 'dragdropzone' } },
      { name: 'ButtonTriggerRow', properties: { variant: 'buttontriggerrow' } },
      { name: 'MiniAvatarUpload', properties: { variant: 'miniavatarupload' } },
    ],
    states: [
      { name: 'Idle', properties: { state: 'idle' } },
      { name: 'DragHover', properties: { state: 'draghover' } },
      { name: 'Uploading', properties: { state: 'uploading' } },
      { name: 'SuccessComplete', properties: { state: 'successcomplete' } },
      { name: 'ErrorFailed', properties: { state: 'errorfailed' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', minHeight: 160 } },
    ],
    defaultProps: { variant: 'dragdropzone', state: 'idle' },
  },
  {
    name: 'FileList',
    category: 'media',
    variants: [
      { name: 'CompactRowList', properties: { variant: 'compactrowlist' } },
      { name: 'ThumbnailGrid', properties: { variant: 'thumbnailgrid' } },
      { name: 'ProgressCard', properties: { variant: 'progresscard' } },
    ],
    states: [
      { name: 'Uploaded', properties: { state: 'uploaded' } },
      { name: 'UploadingProgress', properties: { state: 'uploadingprogress' } },
      { name: 'ErrorRetry', properties: { state: 'errorretry' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'compactrowlist', state: 'uploaded' },
  },
  {
    name: 'ImageGallery',
    category: 'media',
    variants: [
      { name: 'MasonryGrid', properties: { variant: 'masonrygrid' } },
      { name: 'SquareThumbnailGrid', properties: { variant: 'squarethumbnailgrid' } },
      { name: 'FilmstripScroll', properties: { variant: 'filmstripscroll' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'HoverOverlayCaption', properties: { state: 'hoveroverlaycaption' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'masonrygrid', state: 'default' },
  },
  {
    name: 'AudioPlayer',
    category: 'media',
    variants: [
      { name: 'WaveformTrack', properties: { variant: 'waveformtrack' } },
      { name: 'MinimalPill', properties: { variant: 'minimalpill' } },
      { name: 'PodcastEpisodeCard', properties: { variant: 'podcastepisodecard' } },
    ],
    states: [
      { name: 'Paused', properties: { state: 'paused' } },
      { name: 'Playing', properties: { state: 'playing' } },
      { name: 'Buffering', properties: { state: 'buffering' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', height: 60 } },
    ],
    defaultProps: { variant: 'waveformtrack', state: 'paused' },
  },
  {
    name: 'VideoPlayer',
    category: 'media',
    variants: [
      { name: 'PlayerFrame', properties: { variant: 'playerframe' } },
      { name: 'MinimalOverlay', properties: { variant: 'minimaloverlay' } },
      { name: 'PictureInPictureMini', properties: { variant: 'pictureinpicturemini' } },
    ],
    states: [
      { name: 'Paused', properties: { state: 'paused' } },
      { name: 'Playing', properties: { state: 'playing' } },
      { name: 'Buffering', properties: { state: 'buffering' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 640, height: 360 } },
    ],
    defaultProps: { variant: 'playerframe', state: 'paused' },
  },
  {
    name: 'Carousel',
    category: 'media',
    variants: [
      { name: 'CardSlide', properties: { variant: 'cardslide' } },
      { name: 'HeroFullWidth', properties: { variant: 'herofullwidth' } },
      { name: 'ThumbnailNavigation', properties: { variant: 'thumbnailnavigation' } },
    ],
    states: [
      { name: 'Slide1Active', properties: { state: 'slide1active' } },
      { name: 'Slide2Active', properties: { state: 'slide2active' } },
    ],
    sizes: [
      { name: 'md', properties: { name: 'md', width: 640, height: 320 } },
    ],
    defaultProps: { variant: 'cardslide', state: 'slide1active' },
  },
  {
    name: 'AspectRatio',
    category: 'media',
    variants: [
      { name: 'Ratio16_9', properties: { variant: 'ratio16_9' } },
      { name: 'Ratio4_3', properties: { variant: 'ratio4_3' } },
      { name: 'Ratio1_1', properties: { variant: 'ratio1_1' } },
      { name: 'Ratio9_16', properties: { variant: 'ratio9_16' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'ratio16_9', state: 'default' },
  },
  {
    name: 'Divider',
    category: 'media',
    variants: [
      { name: 'HorizontalLine', properties: { variant: 'horizontalline' } },
      { name: 'VerticalLine', properties: { variant: 'verticalline' } },
      { name: 'WithCenterLabel', properties: { variant: 'withcenterlabel' } },
      { name: 'DashedDivider', properties: { variant: 'dasheddivider' } },
    ],
    states: [
      { name: 'Subtle', properties: { state: 'subtle' } },
      { name: 'Strong', properties: { state: 'strong' } },
      { name: 'BrandAccent', properties: { state: 'brandaccent' } },
    ],
    sizes: [
    ],
    defaultProps: { variant: 'horizontalline', state: 'subtle' },
  },
];
