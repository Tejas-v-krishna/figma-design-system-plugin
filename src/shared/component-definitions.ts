// FIGR Design System - Component Definitions (80+ components)
import { ComponentDefinition } from './types';

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // BUTTONS
  {
    name: 'Button',
    category: 'buttons',
    variants: [
      { name: 'Primary', properties: { variant: 'primary' } },
      { name: 'Information', properties: { variant: 'information' } },
      { name: 'Tertiary', properties: { variant: 'tertiary' } },
      { name: 'Ghost', properties: { variant: 'ghost' } },
      { name: 'Error', properties: { variant: 'error' } },
      { name: 'Success', properties: { variant: 'success' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
      { name: 'Loading', properties: { state: 'loading' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', height: 32, paddingX: 12, fontSize: 13 } },
      { name: 'md', properties: { size: 'md', height: 40, paddingX: 16, fontSize: 14 } },
      { name: 'lg', properties: { size: 'lg', height: 48, paddingX: 24, fontSize: 16 } },
    ],
    defaultProps: { variant: 'primary', size: 'md', state: 'default' },
  },
  {
    name: 'IconButton',
    category: 'buttons',
    variants: [
      { name: 'Primary', properties: { variant: 'primary' } },
      { name: 'Information', properties: { variant: 'information' } },
      { name: 'Ghost', properties: { variant: 'ghost' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', dimension: 32 } },
      { name: 'md', properties: { size: 'md', dimension: 40 } },
      { name: 'lg', properties: { size: 'lg', dimension: 48 } },
    ],
    defaultProps: { variant: 'ghost', size: 'md', state: 'default' },
  },
  {
    name: 'ButtonGroup',
    category: 'buttons',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Segmented', properties: { variant: 'segmented' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
  },

  // INPUTS
  {
    name: 'Input',
    category: 'inputs',
    variants: [
      { name: 'Text', properties: { type: 'text' } },
      { name: 'Email', properties: { type: 'email' } },
      { name: 'Password', properties: { type: 'password' } },
      { name: 'Number', properties: { type: 'number' } },
      { name: 'Search', properties: { type: 'search' } },
      { name: 'URL', properties: { type: 'url' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Error', properties: { state: 'error' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
      { name: 'ReadOnly', properties: { state: 'readonly' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', height: 32, fontSize: 13 } },
      { name: 'md', properties: { size: 'md', height: 40, fontSize: 14 } },
      { name: 'lg', properties: { size: 'lg', height: 48, fontSize: 16 } },
    ],
    defaultProps: { type: 'text', size: 'md', state: 'default' },
  },
  {
    name: 'Textarea',
    category: 'inputs',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'AutoResize', properties: { variant: 'auto-resize' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Error', properties: { state: 'error' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', minHeight: 64, fontSize: 13 } },
      { name: 'md', properties: { size: 'md', minHeight: 96, fontSize: 14 } },
      { name: 'lg', properties: { size: 'lg', minHeight: 128, fontSize: 16 } },
    ],
    defaultProps: { variant: 'default', size: 'md', state: 'default' },
  },
  {
    name: 'Select',
    category: 'inputs',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithSearch', properties: { variant: 'with-search' } },
      { name: 'MultiSelect', properties: { variant: 'multi-select' } },
      { name: 'WithGroups', properties: { variant: 'with-groups' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Open', properties: { state: 'open' } },
      { name: 'Error', properties: { state: 'error' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', height: 32, fontSize: 13 } },
      { name: 'md', properties: { size: 'md', height: 40, fontSize: 14 } },
      { name: 'lg', properties: { size: 'lg', height: 48, fontSize: 16 } },
    ],
    defaultProps: { variant: 'default', size: 'md', state: 'default' },
  },

  // FORM CONTROLS
  {
    name: 'Checkbox',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Indeterminate', properties: { variant: 'indeterminate' } },
    ],
    states: [
      { name: 'Unchecked', properties: { state: 'unchecked' } },
      { name: 'Checked', properties: { state: 'checked' } },
      { name: 'Indeterminate', properties: { state: 'indeterminate' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', dimension: 16 } },
      { name: 'md', properties: { size: 'md', dimension: 20 } },
      { name: 'lg', properties: { size: 'lg', dimension: 24 } },
    ],
    defaultProps: { variant: 'default', size: 'md', state: 'unchecked' },
  },
  {
    name: 'Radio',
    category: 'forms',
    variants: [{ name: 'Default', properties: { variant: 'default' } }],
    states: [
      { name: 'Unchecked', properties: { state: 'unchecked' } },
      { name: 'Checked', properties: { state: 'checked' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', dimension: 16 } },
      { name: 'md', properties: { size: 'md', dimension: 20 } },
      { name: 'lg', properties: { size: 'lg', dimension: 24 } },
    ],
    defaultProps: { size: 'md', state: 'unchecked' },
  },
  {
    name: 'Switch',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithLabel', properties: { variant: 'with-label' } },
    ],
    states: [
      { name: 'Off', properties: { state: 'off' } },
      { name: 'On', properties: { state: 'on' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', width: 36, height: 20 } },
      { name: 'md', properties: { size: 'md', width: 44, height: 24 } },
      { name: 'lg', properties: { size: 'lg', width: 52, height: 28 } },
    ],
    defaultProps: { variant: 'default', size: 'md', state: 'off' },
  },
  {
    name: 'Slider',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Range', properties: { variant: 'range' } },
      { name: 'WithLabels', properties: { variant: 'with-labels' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default', state: 'default' },
  },

  // CARDS
  {
    name: 'Card',
    category: 'cards',
    variants: [
      { name: 'Elevated', properties: { variant: 'elevated' } },
      { name: 'Outlined', properties: { variant: 'outlined' } },
      { name: 'Filled', properties: { variant: 'filled' } },
      { name: 'Interactive', properties: { variant: 'interactive' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Focus', properties: { state: 'focus' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [],
    defaultProps: { variant: 'elevated', state: 'default' },
  },
  {
    name: 'CardHeader',
    category: 'cards',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithAction', properties: { variant: 'with-action' } },
      { name: 'WithAvatar', properties: { variant: 'with-avatar' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
  {
    name: 'CardContent',
    category: 'cards',
    variants: [{ name: 'Default', properties: { variant: 'default' } }],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: {},
  },
  {
    name: 'CardFooter',
    category: 'cards',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithActions', properties: { variant: 'with-actions' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
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
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Dismissible', properties: { state: 'dismissible' } },
      { name: 'WithActions', properties: { state: 'with-actions' } },
    ],
    sizes: [],
    defaultProps: { variant: 'info', state: 'default' },
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
      { name: 'WithAction', properties: { state: 'with-action' } },
    ],
    sizes: [],
    defaultProps: { variant: 'info', state: 'default' },
  },
  {
    name: 'Badge',
    category: 'feedback',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Dot', properties: { variant: 'dot' } },
      { name: 'Count', properties: { variant: 'count' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Primary', properties: { state: 'primary' } },
      { name: 'Success', properties: { state: 'success' } },
      { name: 'Warning', properties: { state: 'warning' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', height: 16, fontSize: 10 } },
      { name: 'md', properties: { size: 'md', height: 20, fontSize: 11 } },
      { name: 'lg', properties: { size: 'lg', height: 24, fontSize: 12 } },
    ],
    defaultProps: { variant: 'default', size: 'md', state: 'default' },
  },
  {
    name: 'Progress',
    category: 'feedback',
    variants: [
      { name: 'Linear', properties: { variant: 'linear' } },
      { name: 'Circular', properties: { variant: 'circular' } },
      { name: 'Indeterminate', properties: { variant: 'indeterminate' } },
      { name: 'WithLabel', properties: { variant: 'with-label' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Complete', properties: { state: 'complete' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', height: 4 } },
      { name: 'md', properties: { size: 'md', height: 8 } },
      { name: 'lg', properties: { size: 'lg', height: 12 } },
    ],
    defaultProps: { variant: 'linear', size: 'md', state: 'default' },
  },
  {
    name: 'Spinner',
    category: 'feedback',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Pulse', properties: { variant: 'pulse' } },
      { name: 'Dots', properties: { variant: 'dots' } },
      { name: 'Bars', properties: { variant: 'bars' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [
      { name: 'sm', properties: { size: 'sm', dimension: 16 } },
      { name: 'md', properties: { size: 'md', dimension: 24 } },
      { name: 'lg', properties: { size: 'lg', dimension: 32 } },
      { name: 'xl', properties: { size: 'xl', dimension: 48 } },
    ],
    defaultProps: { variant: 'default', size: 'md' },
  },
  {
    name: 'Skeleton',
    category: 'feedback',
    variants: [
      { name: 'Text', properties: { variant: 'text' } },
      { name: 'Circular', properties: { variant: 'circular' } },
      { name: 'Rectangular', properties: { variant: 'rectangular' } },
      { name: 'Card', properties: { variant: 'card' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Pulse', properties: { state: 'pulse' } },
      { name: 'Wave', properties: { state: 'wave' } },
    ],
    sizes: [],
    defaultProps: { variant: 'text', state: 'default' },
  },
  {
    name: 'EmptyState',
    category: 'feedback',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithIcon', properties: { variant: 'with-icon' } },
      { name: 'WithAction', properties: { variant: 'with-action' } },
      { name: 'Illustrated', properties: { variant: 'illustrated' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
  },

  // NAVIGATION
  {
    name: 'Tabs',
    category: 'navigation',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Underline', properties: { variant: 'underline' } },
      { name: 'Pills', properties: { variant: 'pills' } },
      { name: 'Enclosed', properties: { variant: 'enclosed' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', height: 32, fontSize: 12 } },
      { name: 'md', properties: { size: 'md', height: 40, fontSize: 14 } },
      { name: 'lg', properties: { size: 'lg', height: 48, fontSize: 16 } },
    ],
    defaultProps: { variant: 'default', size: 'md' },
  },
  {
    name: 'Breadcrumb',
    category: 'navigation',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithIcons', properties: { variant: 'with-icons' } },
      { name: 'Collapsed', properties: { variant: 'collapsed' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
  {
    name: 'Pagination',
    category: 'navigation',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Simple', properties: { variant: 'simple' } },
      { name: 'WithSizes', properties: { variant: 'with-sizes' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', height: 32 } },
      { name: 'md', properties: { size: 'md', height: 40 } },
      { name: 'lg', properties: { size: 'lg', height: 48 } },
    ],
    defaultProps: { variant: 'default', size: 'md' },
  },
  {
    name: 'Stepper',
    category: 'navigation',
    variants: [
      { name: 'Horizontal', properties: { variant: 'horizontal' } },
      { name: 'Vertical', properties: { variant: 'vertical' } },
      { name: 'WithContent', properties: { variant: 'with-content' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Complete', properties: { state: 'complete' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [],
    defaultProps: { variant: 'horizontal', state: 'default' },
  },

  // DATA DISPLAY
  {
    name: 'Table',
    category: 'data-display',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Striped', properties: { variant: 'striped' } },
      { name: 'Bordered', properties: { variant: 'bordered' } },
      { name: 'Hoverable', properties: { variant: 'hoverable' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Loading', properties: { state: 'loading' } },
      { name: 'Empty', properties: { state: 'empty' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', cellPadding: 8, fontSize: 12 } },
      { name: 'md', properties: { size: 'md', cellPadding: 12, fontSize: 14 } },
      { name: 'lg', properties: { size: 'lg', cellPadding: 16, fontSize: 16 } },
    ],
    defaultProps: { variant: 'default', size: 'md', state: 'default' },
  },
  {
    name: 'DataGrid',
    category: 'data-display',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithSelection', properties: { variant: 'with-selection' } },
      { name: 'WithSorting', properties: { variant: 'with-sorting' } },
      { name: 'WithFiltering', properties: { variant: 'with-filtering' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Loading', properties: { state: 'loading' } },
      { name: 'Editing', properties: { state: 'editing' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'List',
    category: 'data-display',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithDividers', properties: { variant: 'with-dividers' } },
      { name: 'WithActions', properties: { variant: 'with-actions' } },
      { name: 'WithAvatars', properties: { variant: 'with-avatars' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Selected', properties: { state: 'selected' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
  {
    name: 'Avatar',
    category: 'data-display',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithBadge', properties: { variant: 'with-badge' } },
      { name: 'Group', properties: { variant: 'group' } },
      { name: 'Initials', properties: { variant: 'initials' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [
      { name: 'xs', properties: { size: 'xs', dimension: 24, fontSize: 10 } },
      { name: 'sm', properties: { size: 'sm', dimension: 32, fontSize: 12 } },
      { name: 'md', properties: { size: 'md', dimension: 40, fontSize: 14 } },
      { name: 'lg', properties: { size: 'lg', dimension: 48, fontSize: 16 } },
      { name: 'xl', properties: { size: 'xl', dimension: 64, fontSize: 20 } },
      { name: '2xl', properties: { size: '2xl', dimension: 96, fontSize: 28 } },
    ],
    defaultProps: { variant: 'default', size: 'md' },
  },
  {
    name: 'Divider',
    category: 'data-display',
    variants: [
      { name: 'Horizontal', properties: { variant: 'horizontal' } },
      { name: 'Vertical', properties: { variant: 'vertical' } },
      { name: 'WithLabel', properties: { variant: 'with-label' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [
      { name: 'sm', properties: { size: 'sm', thickness: 1 } },
      { name: 'md', properties: { size: 'md', thickness: 1 } },
      { name: 'lg', properties: { size: 'lg', thickness: 2 } },
    ],
    defaultProps: { variant: 'horizontal', size: 'md' },
  },

  // OVERLAYS
  {
    name: 'Modal',
    category: 'overlays',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Confirmation', properties: { variant: 'confirmation' } },
      { name: 'Form', properties: { variant: 'form' } },
      { name: 'Fullscreen', properties: { variant: 'fullscreen' } },
      { name: 'BottomSheet', properties: { variant: 'bottom-sheet' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
      { name: 'Closing', properties: { state: 'closing' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', maxWidth: 320 } },
      { name: 'md', properties: { size: 'md', maxWidth: 480 } },
      { name: 'lg', properties: { size: 'lg', maxWidth: 640 } },
      { name: 'xl', properties: { size: 'xl', maxWidth: 800 } },
      { name: 'full', properties: { size: 'full', maxWidth: '100%' } },
    ],
    defaultProps: { variant: 'default', size: 'md' },
  },
  {
    name: 'Drawer',
    category: 'overlays',
    variants: [
      { name: 'Left', properties: { variant: 'left' } },
      { name: 'Right', properties: { variant: 'right' } },
      { name: 'Bottom', properties: { variant: 'bottom' } },
    ],
    states: [
      { name: 'Closed', properties: { state: 'closed' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', width: 280 } },
      { name: 'md', properties: { size: 'md', width: 380 } },
      { name: 'lg', properties: { size: 'lg', width: 480 } },
    ],
    defaultProps: { variant: 'right', size: 'md' },
  },
  {
    name: 'Tooltip',
    category: 'overlays',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithArrow', properties: { variant: 'with-arrow' } },
      { name: 'Rich', properties: { variant: 'rich' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Visible', properties: { state: 'visible' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
  {
    name: 'Popover',
    category: 'overlays',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithTitle', properties: { variant: 'with-title' } },
      { name: 'WithActions', properties: { variant: 'with-actions' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
  {
    name: 'DropdownMenu',
    category: 'overlays',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithGroups', properties: { variant: 'with-groups' } },
      { name: 'WithCheckboxes', properties: { variant: 'with-checkboxes' } },
      { name: 'WithRadios', properties: { variant: 'with-radios' } },
    ],
    states: [
      { name: 'Closed', properties: { state: 'closed' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default' },
  },

  // MEDIA
  {
    name: 'Image',
    category: 'media',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Rounded', properties: { variant: 'rounded' } },
      { name: 'Circle', properties: { variant: 'circle' } },
      { name: 'Thumbnail', properties: { variant: 'thumbnail' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Loading', properties: { state: 'loading' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
  {
    name: 'AvatarStack',
    category: 'media',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'WithCount', properties: { variant: 'with-count' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
  },

  // MORE COMPONENTS
  {
    name: 'Accordion',
    category: 'feedback',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Multiple', properties: { variant: 'multiple' } },
      { name: 'Bordered', properties: { variant: 'bordered' } },
    ],
    states: [
      { name: 'Closed', properties: { state: 'closed' } },
      { name: 'Open', properties: { state: 'open' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
  {
    name: 'Tag',
    category: 'feedback',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Removable', properties: { variant: 'removable' } },
      { name: 'WithIcon', properties: { variant: 'with-icon' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Primary', properties: { state: 'primary' } },
      { name: 'Success', properties: { state: 'success' } },
      { name: 'Warning', properties: { state: 'warning' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', height: 20 } },
      { name: 'md', properties: { size: 'md', height: 24 } },
      { name: 'lg', properties: { size: 'lg', height: 28 } },
    ],
    defaultProps: { variant: 'default', size: 'md', state: 'default' },
  },
  {
    name: 'Rating',
    category: 'forms',
    variants: [
      { name: 'Star', properties: { variant: 'star' } },
      { name: 'Heart', properties: { variant: 'heart' } },
      { name: 'Number', properties: { variant: 'number' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'ReadOnly', properties: { state: 'readonly' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [
      { name: 'sm', properties: { size: 'sm', dimension: 16 } },
      { name: 'md', properties: { size: 'md', dimension: 24 } },
      { name: 'lg', properties: { size: 'lg', dimension: 32 } },
    ],
    defaultProps: { variant: 'star', size: 'md', state: 'default' },
  },
  {
    name: 'FileUpload',
    category: 'forms',
    variants: [
      { name: 'Dropzone', properties: { variant: 'dropzone' } },
      { name: 'Button', properties: { variant: 'button' } },
      { name: 'Compact', properties: { variant: 'compact' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'DragActive', properties: { state: 'drag-active' } },
      { name: 'Uploading', properties: { state: 'uploading' } },
      { name: 'Complete', properties: { state: 'complete' } },
      { name: 'Error', properties: { state: 'error' } },
    ],
    sizes: [],
    defaultProps: { variant: 'dropzone', state: 'default' },
  },
  {
    name: 'DatePicker',
    category: 'forms',
    variants: [
      { name: 'Single', properties: { variant: 'single' } },
      { name: 'Range', properties: { variant: 'range' } },
      { name: 'Multiple', properties: { variant: 'multiple' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [],
    defaultProps: { variant: 'single', state: 'default' },
  },
  {
    name: 'TimePicker',
    category: 'forms',
    variants: [
      { name: 'Time12h', properties: { variant: '12h' } },
      { name: 'Time24h', properties: { variant: '24h' } },
      { name: 'WithSeconds', properties: { variant: 'with-seconds' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [],
    defaultProps: { variant: '12h', state: 'default' },
  },
  {
    name: 'ColorPicker',
    category: 'forms',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Swatches', properties: { variant: 'swatches' } },
      { name: 'Slider', properties: { variant: 'slider' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Open', properties: { state: 'open' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default' },
  },

  // LAYOUT COMPONENTS
  {
    name: 'Grid',
    category: 'data-display',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Masonry', properties: { variant: 'masonry' } },
      { name: 'AutoFit', properties: { variant: 'auto-fit' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
  {
    name: 'Stack',
    category: 'data-display',
    variants: [
      { name: 'Horizontal', properties: { variant: 'horizontal' } },
      { name: 'Vertical', properties: { variant: 'vertical' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [
      { name: 'xs', properties: { size: 'xs', gap: 4 } },
      { name: 'sm', properties: { size: 'sm', gap: 8 } },
      { name: 'md', properties: { size: 'md', gap: 16 } },
      { name: 'lg', properties: { size: 'lg', gap: 24 } },
      { name: 'xl', properties: { size: 'xl', gap: 32 } },
    ],
    defaultProps: { variant: 'vertical', size: 'md' },
  },
  {
    name: 'Container',
    category: 'data-display',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Fluid', properties: { variant: 'fluid' } },
      { name: 'Narrow', properties: { variant: 'narrow' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
  },

  // UTILITY COMPONENTS
  {
    name: 'Icon',
    category: 'media',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [
      { name: 'xs', properties: { size: 'xs', dimension: 12 } },
      { name: 'sm', properties: { size: 'sm', dimension: 16 } },
      { name: 'md', properties: { size: 'md', dimension: 20 } },
      { name: 'lg', properties: { size: 'lg', dimension: 24 } },
      { name: 'xl', properties: { size: 'xl', dimension: 32 } },
    ],
    defaultProps: { variant: 'default', size: 'md' },
  },
  {
    name: 'Link',
    category: 'navigation',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'Underline', properties: { variant: 'underline' } },
      { name: 'Muted', properties: { variant: 'muted' } },
    ],
    states: [
      { name: 'Default', properties: { state: 'default' } },
      { name: 'Hover', properties: { state: 'hover' } },
      { name: 'Active', properties: { state: 'active' } },
      { name: 'Visited', properties: { state: 'visited' } },
      { name: 'Disabled', properties: { state: 'disabled' } },
    ],
    sizes: [],
    defaultProps: { variant: 'default', state: 'default' },
  },
  {
    name: 'ScrollArea',
    category: 'data-display',
    variants: [
      { name: 'Default', properties: { variant: 'default' } },
      { name: 'AutoHide', properties: { variant: 'auto-hide' } },
      { name: 'AlwaysVisible', properties: { variant: 'always-visible' } },
    ],
    states: [{ name: 'Default', properties: { state: 'default' } }],
    sizes: [],
    defaultProps: { variant: 'default' },
  },
];

export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return COMPONENT_DEFINITIONS.filter(c => c.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(COMPONENT_DEFINITIONS.map(c => c.category))];
}

export function getComponentByName(name: string): ComponentDefinition | undefined {
  return COMPONENT_DEFINITIONS.find(c => c.name === name);
}