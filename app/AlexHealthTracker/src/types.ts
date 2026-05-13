export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  stringKey?: string;  // maps to app_strings unique_id under page "Sidebar"
  children?: TreeNode[];
}
