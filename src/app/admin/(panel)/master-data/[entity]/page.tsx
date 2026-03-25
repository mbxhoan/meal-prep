import { notFound, redirect } from "next/navigation";
import { MasterDataCrudPage } from "@/features/master-data/components/MasterDataCrudPage";
import { EmployeeDirectoryPage } from "@/features/master-data/components/EmployeeDirectoryPage";
import {
  MASTER_DATA_ENTITY_CONFIGS,
  isMasterDataEntityKey,
  getMasterDataPageData,
} from "@/lib/master-data";
import { getAdminContext } from "@/lib/admin/service";

export default async function MasterDataEntityPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity } = await params;

  if (!isMasterDataEntityKey(entity)) {
    notFound();
  }

  const entityKey = entity;
  const config = MASTER_DATA_ENTITY_CONFIGS[entityKey];

  const context = await getAdminContext();

  if (context.configured && !context.user) {
    redirect("/admin/login");
  }

  if (context.configured && !context.canAccessPanel) {
    redirect("/admin/login?reason=permission");
  }

  if (!context.permissions.includes(config.permissions.read)) {
    redirect("/admin/master-data");
  }

  if (entityKey === "employees") {
    if (!context.shop) {
      notFound();
    }

    return <EmployeeDirectoryPage shopName={context.shop.name} />;
  }

  const pageData = await getMasterDataPageData(entityKey);

  if (!pageData || !context.shop) {
    notFound();
  }

  return (
    <MasterDataCrudPage
      config={pageData.config}
      rows={pageData.rows}
      optionGroups={pageData.optionGroups}
      canCreate={context.permissions.includes(config.permissions.create)}
      canUpdate={context.permissions.includes(config.permissions.update)}
      canDelete={context.permissions.includes(config.permissions.delete)}
      shopName={context.shop.name}
    />
  );
}
