"use client"

import { useEffect, useState } from "react"
import { staffService } from "../../services"
import { CheckCircle, XCircle, User, CreditCard, BadgeCheck, Loader2, Search, Eye, Edit2 } from "lucide-react"

const CustomerVerificationPage = () => {
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [rejected, setRejected] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [verificationNote, setVerificationNote] = useState("")
  const [verifying, setVerifying] = useState(false)

  const [reconsiderationMode, setReconsiderationMode] = useState(false)
  const [reconsiderationNote, setReconsiderationNote] = useState("")

  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, message: "" })
  const [resultModal, setResultModal] = useState({ show: false, type: "", message: "" })

  // Search states cho từng bảng
  const [searchPending, setSearchPending] = useState("")
  const [searchApproved, setSearchApproved] = useState("")
  const [searchRejected, setSearchRejected] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          staffService.getPendingVerifications(),
          staffService.getApprovedVerifications(),
          staffService.getRejectedVerifications(),
        ])

        setPending(pendingRes.data || [])
        setApproved(approvedRes.data || [])
        setRejected(rejectedRes.data || [])
      } catch (err) {
        console.error("Lỗi tải danh sách:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleVerify = async (approvedStatus) => {
    if (!selectedUser) return

    if (!approvedStatus && verificationNote.trim() === "") {
      setResultModal({
        show: true,
        type: "error",
        message: "Vui lòng nhập lý do từ chối trước khi tiếp tục.",
      })
      return
    }

    // Show confirmation modal
    setConfirmModal({
      show: true,
      action: approvedStatus,
      message: approvedStatus ? "Bạn chắc chắn muốn PHÊ DUYỆT hồ sơ này?" : "Bạn chắc chắn muốn TỪ CHỐI hồ sơ này?",
    })
  }

  const handleConfirmVerify = async () => {
    const approvedStatus = confirmModal.action
    setConfirmModal({ show: false, action: null, message: "" })
    setVerifying(true)

    try {
      await staffService.verifyUserDocuments(selectedUser._id, {
        approved: approvedStatus,
        verificationNote,
      })

      // Update UI locally
      setPending((prev) => prev.filter((u) => u._id !== selectedUser._id))
      if (approvedStatus) {
        setApproved((prev) => [...prev, { ...selectedUser, verificationNote }])
      } else {
        setRejected((prev) => [...prev, { ...selectedUser, verificationNote }])
      }

      setResultModal({
        show: true,
        type: "success",
        message: "Đã cập nhật trạng thái xác minh thành công.",
      })

      setSelectedUser(null)
      setVerificationNote("")
    } catch (err) {
      console.error("Xác minh thất bại:", err)
      setResultModal({
        show: true,
        type: "error",
        message: err.response?.data?.message || "Xác minh thất bại, vui lòng thử lại.",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleReconsider = (newStatus) => {
    if (newStatus === false && reconsiderationNote.trim() === "") {
      setResultModal({
        show: true,
        type: "error",
        message: "Vui lòng nhập lý do từ chối.",
      })
      return
    }

    setConfirmModal({
      show: true,
      action: { type: "reconsider", status: newStatus },
      message: newStatus ? "Xem xét lại và PHÊ DUYỆT hồ sơ này?" : "Xem xét lại và TỪ CHỐI hồ sơ này?",
    })
  }

  const handleConfirmReconsider = async () => {
    const { status } = confirmModal.action
    setConfirmModal({ show: false, action: null, message: "" })
    setVerifying(true)

    try {
      await staffService.reconsiderVerification(selectedUser._id, {
        approved: status,
        verificationNote: reconsiderationNote || selectedUser.verificationNote,
      })

      // Update UI locally
      const updatedUser = { ...selectedUser, verificationNote: reconsiderationNote || selectedUser.verificationNote }

      setPending((prev) => prev.filter((u) => u._id !== selectedUser._id))
      setApproved((prev) => prev.filter((u) => u._id !== selectedUser._id))
      setRejected((prev) => prev.filter((u) => u._id !== selectedUser._id))

      if (status) {
        setApproved((prev) => [...prev, updatedUser])
      } else {
        setRejected((prev) => [...prev, updatedUser])
      }

      setResultModal({
        show: true,
        type: "success",
        message: `Hồ sơ đã được ${status ? "phê duyệt" : "từ chối"} lại thành công.`,
      })

      setSelectedUser(null)
      setReconsiderationMode(false)
      setReconsiderationNote("")
    } catch (err) {
      console.error("Xem xét lại thất bại:", err)
      setResultModal({
        show: true,
        type: "error",
        message: err.response?.data?.message || "Xem xét lại thất bại, vui lòng thử lại.",
      })
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Đang tải danh sách hồ sơ...</p>
        </div>
      </div>
    )
  }

  const renderTable = (title, data, color, searchValue, setSearchValue, statusType) => {
    const filteredData = data.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchValue.toLowerCase()),
    )

    const colorMap = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        headerBg: "bg-blue-100",
        icon: "text-blue-600",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        headerBg: "bg-green-100",
        icon: "text-green-600",
      },
      red: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        headerBg: "bg-red-100",
        icon: "text-red-600",
      },
    }

    const colors = colorMap[color]
    const statusIcon = statusType === "pending" ? "⏳" : statusType === "approved" ? "✓" : "✕"

    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className={`${colors.bg} ${colors.text} rounded-lg p-2`}>
            <span className="text-lg">{statusIcon}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className={`text-sm ${colors.text}`}>{data.length} hồ sơ</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Tìm theo Họ tên, Email hoặc SĐT..."
              className="w-full md:w-96 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className={`${colors.bg} border ${colors.border} ${colors.text} p-6 rounded-lg text-center`}>
            <p className="font-medium">{searchValue ? "Không tìm thấy kết quả phù hợp." : "Không có hồ sơ nào."}</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={colors.headerBg}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Họ tên</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SĐT</th>
                    {statusType === "rejected" && (
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Lý do</th>
                    )}
                    {(statusType === "approved" || statusType === "rejected") && (
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Xem xét lại</th>
                    )}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone || "—"}</td>
                      {statusType === "rejected" && (
                        <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                          {user.verificationNote || "—"}
                        </td>
                      )}
                      {(statusType === "approved" || statusType === "rejected") && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setReconsiderationMode(true)
                              setReconsiderationNote(user.verificationNote || "")
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition font-medium text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Xem xét lại
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setReconsiderationMode(false)
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          {statusType === "pending" ? "Xác minh" : "Xem"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Xác minh hồ sơ</h1>
          <p className="text-gray-600">Quản lý xác minh hồ sơ khách hàng thuê xe điện</p>
        </div>

        {/* Danh sách đang chờ */}
        {renderTable("Hồ sơ đang chờ xác minh", pending, "blue", searchPending, setSearchPending, "pending")}

        {/* Hồ sơ đã phê duyệt */}
        {renderTable("Hồ sơ đã được phê duyệt", approved, "green", searchApproved, setSearchApproved, "approved")}

        {/* Hồ sơ bị từ chối */}
        {renderTable("Hồ sơ bị từ chối", rejected, "red", searchRejected, setSearchRejected, "rejected")}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {reconsiderationMode ? "Xem xét lại hồ sơ" : "Chi tiết hồ sơ"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{selectedUser.fullName}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setReconsiderationMode(false)
                  setReconsiderationNote("")
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Khách hàng</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedUser.fullName}</p>
                  </div>
                </div>
              </div>

              {/* CMND/CCCD */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Chứng minh nhân dân / Căn cước</p>
                    <p className="text-sm text-gray-600">{selectedUser.nationalId?.number || ""}</p>
                  </div>
                </div>
                {selectedUser.nationalId?.images && selectedUser.nationalId.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.nationalId.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200"
                        onClick={() => window.open(img, "_blank")}
                      >
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`nationalId-${idx}`}
                          className="w-full h-40 object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                          <p className="text-white opacity-0 group-hover:opacity-100 transition text-sm font-medium">
                            Xem phóng to
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bằng lái xe */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BadgeCheck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bằng lái xe</p>
                    <p className="text-sm text-gray-600">{selectedUser.driverLicense?.number || ""}</p>
                  </div>
                </div>
                {selectedUser.driverLicense?.images && selectedUser.driverLicense.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.driverLicense.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200"
                        onClick={() => window.open(img, "_blank")}
                      >
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`license-${idx}`}
                          className="w-full h-40 object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                          <p className="text-white opacity-0 group-hover:opacity-100 transition text-sm font-medium">
                            Xem phóng to
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!reconsiderationMode && pending.some((u) => u._id === selectedUser._id) && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Ghi chú xác minh</label>
                  <textarea
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    rows="4"
                    placeholder="Nhập ghi chú hoặc lý do từ chối (nếu cần)..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                </div>
              )}

              {reconsiderationMode && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Cập nhật lý do / ghi chú</label>
                  <textarea
                    value={reconsiderationNote}
                    onChange={(e) => setReconsiderationNote(e.target.value)}
                    rows="4"
                    placeholder="Nhập lý do xem xét lại..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                </div>
              )}
            </div>

            {!reconsiderationMode && pending.some((u) => u._id === selectedUser._id) && (
              <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => handleVerify(false)}
                  disabled={verifying}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-medium transition"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Từ chối
                </button>
                <button
                  onClick={() => handleVerify(true)}
                  disabled={verifying}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-medium transition"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Phê duyệt
                </button>
              </div>
            )}

            {reconsiderationMode && (
              <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => {
                    setReconsiderationMode(false)
                    setReconsiderationNote("")
                  }}
                  disabled={verifying}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleReconsider(false)}
                  disabled={verifying}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-medium transition"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Từ chối lại
                </button>
                <button
                  onClick={() => handleReconsider(true)}
                  disabled={verifying}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-medium transition"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Phê duyệt lại
                </button>
              </div>
            )}

            {!reconsiderationMode && !pending.some((u) => u._id === selectedUser._id) && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setReconsiderationMode(false)
                  }}
                  className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium transition"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">{confirmModal.message}</p>
            </div>
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setConfirmModal({ show: false, action: null, message: "" })}
                className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 font-medium transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (confirmModal.action?.type === "reconsider") {
                    handleConfirmReconsider()
                  } else {
                    handleConfirmVerify()
                  }
                }}
                disabled={verifying}
                className={`flex-1 text-white py-2 rounded-lg font-medium transition ${
                  confirmModal.action === true || confirmModal.action?.status === true
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : confirmModal.action === true || confirmModal.action?.status === true ? (
                  "Phê duyệt"
                ) : (
                  "Từ chối"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {resultModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div
              className={`p-6 border-b ${
                resultModal.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {resultModal.type === "success" ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <h3
                  className={`text-lg font-semibold ${
                    resultModal.type === "success" ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {resultModal.type === "success" ? "Thành công" : "Lỗi"}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700">{resultModal.message}</p>
            </div>
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <button
                onClick={() => setResultModal({ show: false, type: "", message: "" })}
                className={`w-full py-2 rounded-lg font-medium transition text-white ${
                  resultModal.type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerVerificationPage
