import { useState, useEffect, useCallback } from 'react'
import { Avatar } from './Avatar'
import { Modal } from './Modal'
import { useToast } from '../lib/toast'
import { SUPER_ADMIN_EMAIL, type UserRole } from '../lib/admin'
import {
  fetchAllUsers,
  fetchAllKids,
  fetchAllActivities,
  adminUpdateUser,
  adminUpdateKid,
  adminDeleteKid,
  adminDeleteActivity,
  adminDeleteUser,
  type AdminUser,
  type AdminKid,
  type AdminActivity,
} from '../lib/adminData'

type AdminSection = 'users' | 'kids' | 'activities'

export function AdminPanel() {
  const { addToast } = useToast()
  const [section, setSection] = useState<AdminSection>('users')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [kids, setKids] = useState<AdminKid[]>([])
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'user' | 'kid' | 'activity'
    id: string
    label: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, k, a] = await Promise.all([fetchAllUsers(), fetchAllKids(), fetchAllActivities()])
      setUsers(u)
      setKids(k)
      setActivities(a)
    } catch (err) {
      addToast({ message: 'Failed to load admin data. Check Firestore rules.', type: 'error' })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const q = search.trim().toLowerCase()

  const filteredUsers = users.filter(
    (u) =>
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.id.includes(q)
  )

  const filteredKids = kids.filter(
    (k) =>
      !q ||
      k.name.toLowerCase().includes(q) ||
      k.ownerEmail?.toLowerCase().includes(q) ||
      k.id.includes(q)
  )

  const filteredActivities = activities.filter(
    (a) =>
      !q ||
      a.title?.toLowerCase().includes(q) ||
      a.ownerEmail?.toLowerCase().includes(q) ||
      a.location?.toLowerCase().includes(q)
  )

  async function handleUserRoleChange(userId: string, email: string, role: UserRole) {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL && role !== 'super_admin') {
      addToast({ message: 'Cannot change role of the primary super admin', type: 'error' })
      return
    }
    try {
      await adminUpdateUser(userId, { role })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      addToast({ message: 'User updated', type: 'success' })
    } catch {
      addToast({ message: 'Failed to update user', type: 'error' })
    }
  }

  async function handleUserNameChange(userId: string, displayName: string) {
    try {
      await adminUpdateUser(userId, { displayName })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, displayName } : u)))
      addToast({ message: 'User updated', type: 'success' })
    } catch {
      addToast({ message: 'Failed to update user', type: 'error' })
    }
  }

  async function handleKidSave(kid: AdminKid) {
    try {
      await adminUpdateKid(kid.id, { name: kid.name, age: kid.age ?? null })
      addToast({ message: 'Kid updated', type: 'success' })
    } catch {
      addToast({ message: 'Failed to update kid', type: 'error' })
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      if (deleteTarget.type === 'user') await adminDeleteUser(deleteTarget.id)
      if (deleteTarget.type === 'kid') await adminDeleteKid(deleteTarget.id)
      if (deleteTarget.type === 'activity') await adminDeleteActivity(deleteTarget.id)
      addToast({ message: 'Deleted', type: 'success' })
      setDeleteTarget(null)
      await loadAll()
    } catch {
      addToast({ message: 'Delete failed', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <p className="text-graphite-grey py-8 text-center">Loading admin data...</p>
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 bg-warm-gray-tint/30 border-sky-blue/30">
        <h2 className="text-xl font-bold text-charcoal-black">Super Admin</h2>
        <p className="text-sm text-graphite-grey mt-1">
          Signed in as <strong>{SUPER_ADMIN_EMAIL}</strong>. Manage all parents, kids, and activities.
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-graphite-grey">
          <span>{users.length} users</span>
          <span>{kids.length} kids</span>
          <span>{activities.length} activities</span>
          <button type="button" onClick={loadAll} className="btn-secondary text-sm ml-auto">
            Refresh
          </button>
        </div>
      </div>

      <input
        type="search"
        placeholder="Search users, kids, activities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input"
      />

      <div className="ph-tabs">
        {(['users', 'kids', 'activities'] as AdminSection[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`ph-tab capitalize ${section === s ? 'ph-tab-active' : ''}`}
          >
            {s} ({s === 'users' ? filteredUsers.length : s === 'kids' ? filteredKids.length : filteredActivities.length})
          </button>
        ))}
      </div>

      {section === 'users' && (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <div key={u.id} className="card p-4 flex flex-wrap gap-4 items-center">
              <Avatar name={u.displayName || u.email} photoURL={u.photoURL} size="md" />
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium text-charcoal-black">{u.email}</p>
                <p className="text-xs text-faded-grey font-mono">{u.id}</p>
              </div>
              <input
                type="text"
                defaultValue={u.displayName || ''}
                placeholder="Display name"
                className="input max-w-[180px]"
                onBlur={(e) => {
                  if (e.target.value !== (u.displayName || '')) {
                    handleUserNameChange(u.id, e.target.value)
                  }
                }}
              />
              <select
                value={u.role || 'parent'}
                disabled={u.email?.toLowerCase() === SUPER_ADMIN_EMAIL}
                onChange={(e) => handleUserRoleChange(u.id, u.email, e.target.value as UserRole)}
                className="input max-w-[140px]"
              >
                <option value="parent">Parent</option>
                <option value="super_admin">Super admin</option>
                <option value="disabled">Disabled</option>
              </select>
              {u.email?.toLowerCase() !== SUPER_ADMIN_EMAIL && (
                <button
                  type="button"
                  className="btn-secondary text-sm text-sunset-orange"
                  onClick={() =>
                    setDeleteTarget({
                      type: 'user',
                      id: u.id,
                      label: `${u.email} (and their kids & activities)`,
                    })
                  }
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {section === 'kids' && (
        <div className="space-y-3">
          {filteredKids.map((kid) => (
            <div key={kid.id} className="card p-4 flex flex-wrap gap-3 items-center">
              <Avatar name={kid.name} photoURL={kid.photoURL} size="md" />
              <input
                type="text"
                value={kid.name}
                onChange={(e) =>
                  setKids((prev) =>
                    prev.map((k) => (k.id === kid.id ? { ...k, name: e.target.value } : k))
                  )
                }
                className="input flex-1 min-w-[120px]"
              />
              <input
                type="number"
                value={kid.age ?? ''}
                placeholder="Age"
                onChange={(e) =>
                  setKids((prev) =>
                    prev.map((k) =>
                      k.id === kid.id
                        ? { ...k, age: e.target.value ? parseInt(e.target.value) : null }
                        : k
                    )
                  )
                }
                className="input w-20"
              />
              <span className="text-sm text-graphite-grey">{kid.ownerEmail}</span>
              <button type="button" className="btn-secondary text-sm" onClick={() => handleKidSave(kid)}>
                Save
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() =>
                  setDeleteTarget({ type: 'kid', id: kid.id, label: kid.name })
                }
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {section === 'activities' && (
        <div className="space-y-3">
          {filteredActivities.map((act) => (
            <div key={act.id} className="card p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-charcoal-black">{act.title}</h3>
                  <p className="text-sm text-graphite-grey">
                    {act.dueDate} {act.dueTime} · {act.ownerEmail}
                  </p>
                  {act.location && <p className="text-sm text-graphite-grey">📍 {act.location}</p>}
                  <p className="text-xs text-faded-grey mt-1">
                    Kids: {act.kidIds?.length || 0} · Invitees: {act.inviteeIds?.length || 0}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary text-sm h-fit"
                  onClick={() =>
                    setDeleteTarget({ type: 'activity', id: act.id, label: act.title })
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        title="Confirm delete"
        onClose={() => !deleting && setDeleteTarget(null)}
        actions={[
          {
            label: deleting ? 'Deleting...' : 'Delete',
            onClick: handleConfirmDelete,
            variant: 'primary',
            disabled: deleting,
          },
        ]}
      >
        <p className="text-graphite-grey">
          Permanently delete <strong>{deleteTarget?.label}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
