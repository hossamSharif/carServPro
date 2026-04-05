

Constitution ID: CONST-002
Name: Mandatory shadcn/ui MCP Tool Usage for UI Implementation
Scope: Global — applies to any task involving UI components, layouts, or design
Enforcement: Hard Rule (agent MUST NOT write manual UI code without first 
             consulting shadcn/ui MCP tool)

---

## RULE

The AI agent MUST use the shadcn/ui MCP tool as the first action whenever 
any implementation task involves creating, modifying, or styling a UI 
component, page layout, or design element.

The agent MUST NOT write manual Tailwind class combinations, custom component 
structures, or hardcoded styles for any element that shadcn/ui already provides 
or that can be composed from shadcn/ui primitives.

---

## MANDATORY MCP TOOL USAGE TRIGGERS

The agent MUST invoke the shadcn/ui MCP tool before writing any code when 
the task involves ANY of the following:

  - Adding a new page or route that contains UI elements
  - Creating a form (use shadcn/ui Form, Input, Select, Checkbox, etc.)
  - Building a data table or list (use shadcn/ui Table or DataTable)
  - Adding navigation (use shadcn/ui NavigationMenu, Breadcrumb, Tabs)
  - Showing alerts, toasts, or notifications (use shadcn/ui Toast, Alert)
  - Creating dialogs, modals, or confirmation prompts (use shadcn/ui Dialog, 
    AlertDialog)
  - Building a sidebar or drawer (use shadcn/ui Sheet or custom with Separator)
  - Displaying cards, stats, or KPI widgets (use shadcn/ui Card)
  - Adding date pickers or calendar inputs (use shadcn/ui Calendar, Popover)
  - Adding dropdowns or command palettes (use shadcn/ui DropdownMenu, Command)
  - Building skeleton loading states (use shadcn/ui Skeleton)
  - Any icon usage (use lucide-react, consistent with shadcn/ui defaults)
  - Any badge, tag, or status indicator (use shadcn/ui Badge)

---

## REQUIRED MCP WORKFLOW

For every UI task, the agent MUST follow this sequence:

1. **Query the MCP tool** for the relevant component(s):
   - Ask: "What shadcn/ui components are available for [use case]?"
   - Ask: "What are the props and variants for [component name]?"
   - Ask: "Show me the correct installation command for [component]"

2. **Install the component** if not already present using the MCP tool's 
   provided CLI command (e.g., `npx shadcn@latest add <component>`). 
   Do NOT copy-paste component source manually.

3. **Use the component exactly as the MCP tool specifies** — respect the 
   component's API, variants, and composition patterns.

4. **RTL compliance**: After retrieving the component from MCP, the agent 
   MUST verify and apply RTL-compatible Tailwind variants (`rtl:` prefix) 
   for any directional styles (padding, margin, text alignment, flex direction, 
   icons positioning).

5. **Theme compliance**: The agent MUST use CSS variables defined by shadcn/ui 
   (`bg-background`, `text-foreground`, `border`, `ring`, etc.) instead of 
   hardcoded Tailwind color classes. This ensures dark/light mode works 
   automatically.

---

## PROHIBITED PATTERNS

The agent MUST NEVER do any of the following:
  - Write a custom `<button>` element where shadcn/ui `<Button>` is available
  - Write a custom modal/overlay where shadcn/ui `<Dialog>` is available
  - Hardcode colors: NO `text-gray-500`, `bg-white`, `border-gray-200` etc. — 
    use `text-muted-foreground`, `bg-background`, `border` (CSS var-backed)
  - Use arbitrary Tailwind values (`w-[347px]`) unless absolutely unavoidable 
    for a one-off layout need
  - Install a third-party UI component library (Radix directly, MUI, Chakra, 
    Ant Design, etc.) when a shadcn/ui equivalent exists
  - Modify the source files of installed shadcn/ui components in `components/ui/` 
    — extend via composition wrappers in `components/shared/` or `components/admin/`

---

## ARABIC / RTL DESIGN RULES (enforced alongside MCP usage)

When using any shadcn/ui component in Arabic (RTL) context:
  - Wrap all page roots with `dir="rtl"` when Arabic locale is active
  - Use `font-[Tajawal]` or equivalent Arabic-supporting font for all Arabic text
  - For directional icons (arrows, chevrons), flip using `rtl:rotate-180` or 
    `rtl:scale-x-[-1]`
  - Ensure shadcn/ui Sheet opens from the correct side: 
    `side="right"` for LTR, `side="left"` for RTL
  - Numeric display: use Arabic-Indic numerals (٠١٢٣) in Arabic mode for 
    invoice numbers, currency, and dates

---

## VIOLATION CONSEQUENCE

If the agent implements a UI element without first consulting the shadcn/ui 
MCP tool, the task output is considered non-compliant. The agent MUST 
refactor the non-compliant code to use the correct shadcn/ui component 
before the implementation task can be committed (CONST-001 commit will 
be blocked until UI compliance is achieved).