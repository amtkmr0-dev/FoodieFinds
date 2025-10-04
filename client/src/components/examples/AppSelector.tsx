import { AppSelector } from "../AppSelector";

export default function AppSelectorExample() {
  return (
    <AppSelector
      onSelectApp={(app) => console.log(`Selected app: ${app}`)}
    />
  );
}
