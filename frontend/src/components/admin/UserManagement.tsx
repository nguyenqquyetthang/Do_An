import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Ticket,
  X,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { AdminNav } from './AdminNav';
import {
  mockUsers,
  type UserItem,
  type UserStatus,
  type AppRole,
} from '../../data/mockData';

function formatPoints(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' điểm';
}

const roleBadgeColors: Record<AppRole, { bg: string; text: string; border: string; label: string }> = {
  ADMIN: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    label: 'Quản trị viên (Admin)',
  },
  ORGANIZER: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    label: 'Nhà tổ chức (Organizer)',
  },
  AUDITOR: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    label: 'Kiểm toán viên (Auditor)',
  },
  USER: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    label: 'Khách hàng (User)',
  },
};

const statusBadgeColors: Record<UserStatus, { bg: string; text: string; border: string; label: string; dot: string }> = {
  active: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    label: 'Đang hoạt động',
    dot: 'bg-emerald-400',
  },
  inactive: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    label: 'Tạm dừng',
    dot: 'bg-slate-400',
  },
  locked: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    label: 'Đã khóa',
    dot: 'bg-rose-400',
  },
};

type FormData = {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: AppRole;
  status: UserStatus;
  balance: number;
};

const initialFormData: FormData = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  role: 'USER',
  status: 'active',
  balance: 0,
};

export function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery);

      const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
      const matchStatus = selectedStatus === 'ALL' || u.status === selectedStatus;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const locked = users.filter((u) => u.status === 'locked').length;
    const totalPoints = users.reduce((acc, curr) => acc + curr.balance, 0);
    return { total, active, locked, totalPoints };
  }, [users]);

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setFormData(initialFormData);
    setIsAddModalOpen(true);
  };

  // Handle submit Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.username.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const newUser: UserItem = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      username: formData.username.trim().toLowerCase(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || 'Chưa cập nhật',
      role: formData.role,
      status: formData.status,
      balance: Number(formData.balance) || 0,
      totalTickets: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers([newUser, ...users]);
    setIsAddModalOpen(false);
    showToast(`Đã thêm người dùng mới "${newUser.fullName}" thành công!`);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      balance: user.balance,
    });
    setIsEditModalOpen(true);
  };

  // Handle submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              fullName: formData.fullName.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: formData.phone.trim(),
              role: formData.role,
              status: formData.status,
              balance: Number(formData.balance) || 0,
            }
          : u
      )
    );

    setIsEditModalOpen(false);
    showToast(`Đã cập nhật thông tin người dùng "${formData.fullName}".`);
  };

  // Handle Toggle Lock
  const handleToggleLock = (user: UserItem) => {
    const nextStatus: UserStatus = user.status === 'locked' ? 'active' : 'locked';
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
    );
    showToast(
      nextStatus === 'locked'
        ? `Đã khóa tài khoản "${user.fullName}".`
        : `Đã mở khóa tài khoản "${user.fullName}".`
    );
  };

  // Handle open Delete Modal
  const handleOpenDelete = (user: UserItem) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  // Handle confirm Delete
  const handleConfirmDelete = () => {
    if (!currentUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== currentUser.id));
    setIsDeleteModalOpen(false);
    showToast(`Đã xóa người dùng "${currentUser.fullName}".`);
    setCurrentUser(null);
  };

  // Handle View Detail
  const handleOpenDetail = (user: UserItem) => {
    setCurrentUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-slate-900/95 px-5 py-4 text-emerald-300 shadow-2xl backdrop-blur-xl transition animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <AdminNav />

      {/* Header Panel */}
      <div className="card-glass rounded-3xl p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Hệ thống quản trị
            </div>
            <h1 className="mt-3 text-3xl font-black text-white lg:text-4xl">Quản lý Người dùng</h1>
            <p className="mt-2 text-sm text-slate-300">
              Quản lý danh sách tài khoản, phân quyền vai trò (Admin, Organizer, Auditor, User), số dư điểm và trạng thái hoạt động.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setUsers(mockUsers);
                setSearchQuery('');
                setSelectedRole('ALL');
                setSelectedStatus('ALL');
                showToast('Đã làm mới dữ liệu ban đầu!');
              }}
              className="secondary-btn inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold hover:border-cyan-400/50"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
            <button
              onClick={handleOpenAdd}
              className="primary-btn inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg shadow-cyan-500/20"
            >
              <UserPlus className="h-4 w-4" />
              Thêm người dùng mới
            </button>
          </div>
        </div>
      </div>

      {/* Quick Statistics KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-glass rounded-2xl p-5 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">Tổng người dùng</span>
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-white">{stats.total}</div>
          <div className="mt-1 text-xs text-slate-400">Tài khoản được đăng ký trong hệ thống</div>
        </div>

        <div className="card-glass rounded-2xl p-5 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">Đang hoạt động</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-400">{stats.active}</div>
          <div className="mt-1 text-xs text-emerald-400/80">
            {((stats.active / (stats.total || 1)) * 100).toFixed(0)}% tài khoản sẵn sàng giao dịch
          </div>
        </div>

        <div className="card-glass rounded-2xl p-5 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">Tài khoản bị khóa</span>
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-rose-400">{stats.locked}</div>
          <div className="mt-1 text-xs text-rose-400/80">Cần xem xét hoặc xác minh bổ sung</div>
        </div>

        <div className="card-glass rounded-2xl p-5 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">Tổng điểm ví lưu hành</span>
            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-cyan-300">{formatPoints(stats.totalPoints)}</div>
          <div className="mt-1 text-xs text-slate-400">Khả dụng trong tài khoản thành viên</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-glass rounded-3xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, username, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Filter className="h-4 w-4" />
              <span>Vai trò:</span>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
              <option value="ORGANIZER">Tổ chức (ORGANIZER)</option>
              <option value="USER">Người dùng (USER)</option>
              <option value="AUDITOR">Kiểm toán (AUDITOR)</option>
            </select>

            <div className="flex items-center gap-2 text-sm text-slate-400 ml-2">
              <span>Trạng thái:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="card-glass rounded-3xl overflow-hidden border border-slate-700/70">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="text-sm text-slate-300">
            Hiển thị <span className="font-bold text-cyan-300">{filteredUsers.length}</span> / {users.length} người dùng
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-cyan-300 underline"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-4 pl-6 pr-4">Người dùng</th>
                <th className="py-4 px-4">Thông tin liên hệ</th>
                <th className="py-4 px-4">Vai trò</th>
                <th className="py-4 px-4">Số dư ví</th>
                <th className="py-4 px-4">Vé / Chi tiêu</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-4">Ngày tạo</th>
                <th className="py-4 pr-6 pl-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    Không tìm thấy người dùng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleConfig = roleBadgeColors[user.role];
                  const statusConfig = statusBadgeColors[user.status];

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/40 transition duration-150"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl font-bold text-sm ${
                              user.role === 'ADMIN'
                                ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white'
                                : user.role === 'ORGANIZER'
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                : user.role === 'AUDITOR'
                                ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950'
                                : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950'
                            }`}
                          >
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white hover:text-cyan-300 cursor-pointer" onClick={() => handleOpenDetail(user)}>
                              {user.fullName}
                            </div>
                            <div className="text-xs text-slate-400">@{user.username} • {user.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="h-3.5 w-3.5 text-slate-500" />
                            {user.phone}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleConfig.bg} ${roleConfig.text} ${roleConfig.border}`}
                        >
                          <Shield className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-cyan-300">
                          {formatPoints(user.balance)}
                        </span>
                      </td>

                      {/* Tickets & Spent */}
                      <td className="py-4 px-4">
                        <div className="text-xs">
                          <div className="font-semibold text-slate-200">
                            {user.totalTickets} vé
                          </div>
                          <div className="text-slate-400">
                            Đã chi: {user.totalSpent.toLocaleString()} đ
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {user.createdAt}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(user)}
                            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleLock(user)}
                            className={`rounded-xl p-2 transition ${
                              user.status === 'locked'
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-amber-400 hover:bg-amber-500/10'
                            }`}
                            title={user.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {user.status === 'locked' ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenDelete(user)}
                            className="rounded-xl p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
                            title="Xóa người dùng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: ADD USER ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="card-glass w-full max-w-lg rounded-3xl p-6 lg:p-8 shadow-2xl border border-cyan-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Thêm người dùng mới</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="nguyenvana"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Vai trò (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="USER">USER (Khách hàng)</option>
                    <option value="ORGANIZER">ORGANIZER (Tổ chức)</option>
                    <option value="AUDITOR">AUDITOR (Kiểm toán)</option>
                    <option value="ADMIN">ADMIN (Quản trị viên)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Trạng thái ban đầu</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                    <option value="locked">Khóa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Số dư điểm khởi tạo</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-slate-500"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="primary-btn rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20"
                >
                  Thêm người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="card-glass w-full max-w-lg rounded-3xl p-6 lg:p-8 shadow-2xl border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-300">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Chỉnh sửa người dùng</h3>
                  <p className="text-xs text-slate-400">ID: {currentUser.id} • @{currentUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="USER">USER</option>
                    <option value="ORGANIZER">ORGANIZER</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                    <option value="locked">Đã khóa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Số dư điểm ví</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-slate-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: USER DETAILS ================= */}
      {isDetailModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="card-glass w-full max-w-xl rounded-3xl p-6 lg:p-8 shadow-2xl border border-cyan-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 font-bold text-lg text-slate-950">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{currentUser.fullName}</h3>
                  <p className="text-xs text-slate-400">@{currentUser.username} • ID: {currentUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Profile Overview */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Vai trò & Quyền hạn</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                        roleBadgeColors[currentUser.role].bg
                      } ${roleBadgeColors[currentUser.role].text} ${
                        roleBadgeColors[currentUser.role].border
                      }`}
                    >
                      {roleBadgeColors[currentUser.role].label}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Trạng thái</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusBadgeColors[currentUser.status].bg
                      } ${statusBadgeColors[currentUser.status].text} ${
                        statusBadgeColors[currentUser.status].border
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${statusBadgeColors[currentUser.status].dot}`} />
                      {statusBadgeColors[currentUser.status].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info & Stats */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold text-white">{currentUser.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <span className="font-semibold text-white">{currentUser.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Ngày tham gia:</span>
                  <span className="font-semibold text-white">{currentUser.createdAt}</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between text-sm">
                  <span className="text-slate-400">Số dư điểm ví:</span>
                  <span className="font-bold text-cyan-300">{formatPoints(currentUser.balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tổng số vé đã mua:</span>
                  <span className="font-semibold text-white">{currentUser.totalTickets} vé</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tổng điểm chi tiêu:</span>
                  <span className="font-semibold text-white">{currentUser.totalSpent.toLocaleString()} điểm</span>
                </div>
              </div>

              {/* History simulation */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Hoạt động gần đây</div>
                  <span className="text-xs text-cyan-400">Đã đồng bộ</span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2.5">
                    <span>Đăng nhập hệ thống</span>
                    <span className="text-slate-400">Hôm nay, 14:22</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2.5">
                    <span>Chọn giữ số vé #0007 (CT #001)</span>
                    <span className="text-slate-400">Hôm qua, 20:05</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:border-slate-500"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(currentUser);
                  }}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
                >
                  Chỉnh sửa tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {isDeleteModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="card-glass w-full max-w-md rounded-3xl p-6 lg:p-8 shadow-2xl border border-rose-500/30 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Xác nhận xóa tài khoản?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Bạn có chắc chắn muốn xóa người dùng <strong className="text-white">{currentUser.fullName}</strong> (@{currentUser.username}) khỏi hệ thống? Thao tác này không thể hoàn tác.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-slate-500"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-500 transition"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
