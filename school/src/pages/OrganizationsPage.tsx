import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PermissionGate } from "../components/auth/PermissionGate";
import { SkeletonList } from "../components/ui/Skeleton";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import type { Organization } from "../types";
import { organizationsRepository } from "../lib/db/repositories";

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; org?: Organization }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const list = await organizationsRepository.getAll();
      setOrganizations(list);
    } catch {
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const slug = (form.elements.namedItem("slug") as HTMLInputElement).value.trim() || undefined;
    const billingEmail = (form.elements.namedItem("billingEmail") as HTMLInputElement).value.trim() || undefined;
    if (!name) return;
    try {
      if (modal.org) {
        await organizationsRepository.update(modal.org.id, { name, slug, billingEmail });
      } else {
        await organizationsRepository.create({ name, slug, billingEmail });
      }
      await loadOrgs();
      setModal({ open: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await organizationsRepository.delete(confirmDelete.id);
      await loadOrgs();
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Organizations</h2>
          <p className="text-slate-600">Create and manage organizations (tenants). Each org can have multiple schools.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All organizations</CardTitle>
          <PermissionGate permission="schools:create">
            <Button size="sm" onClick={() => setModal({ open: true })}>
              <Plus className="mr-1 h-4 w-4" />
              Add organization
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonList items={5} />
          ) : organizations.length === 0 ? (
            <p className="text-sm text-slate-500">No organizations yet. Add one to create schools under it.</p>
          ) : (
            <ul className="space-y-2">
              {organizations.map((org) => (
                <li
                  key={org.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">{org.name}</p>
                      {(org.slug || org.billingEmail) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {[org.slug, org.billingEmail].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <PermissionGate permission="schools:create">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModal({ open: true, org })}
                        aria-label="Edit organization"
                      >
                        <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete({ id: org.id, name: org.name })}
                        aria-label="Delete organization"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30" />
                      </Button>
                    </PermissionGate>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.org ? "Edit organization" : "Add organization"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="org-name" className="block text-sm font-medium text-slate-700">Name</label>
            <input
              id="org-name"
              name="name"
              type="text"
              required
              defaultValue={modal.org?.name}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              placeholder="e.g. Acme Education"
            />
          </div>
          <div>
            <label htmlFor="org-slug" className="block text-sm font-medium text-slate-700">Slug (optional)</label>
            <input
              id="org-slug"
              name="slug"
              type="text"
              defaultValue={modal.org?.slug}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              placeholder="e.g. acme-edu"
            />
          </div>
          <div>
            <label htmlFor="org-billingEmail" className="block text-sm font-medium text-slate-700">Billing email (optional)</label>
            <input
              id="org-billingEmail"
              name="billingEmail"
              type="email"
              defaultValue={modal.org?.billingEmail}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              placeholder="billing@example.com"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit">{modal.org ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete organization"
          message={`Delete "${confirmDelete.name}"? Schools and users under this org will be affected.`}
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
