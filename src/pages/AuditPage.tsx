import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  TablePagination,
  IconButton,
  Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getAuditLogs } from "../api/auditApi";
import AuditDetailModal from "../components/AuditDetailModal";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(0); // 0-based
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);

  const [filterUser, setFilterUser] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterModule, setFilterModule] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Parámetros para API
  const params = useMemo(
    () => ({
      page: page + 1,
      limit,
      userId: filterUser ? Number(filterUser) : "",
      action: filterAction || undefined,
      module: filterModule || undefined,
      search: search || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [page, limit, filterUser, filterAction, filterModule, search, from, to]
  );

  const load = async () => {
    const res = await getAuditLogs(params);
    setRows(res.data);
    setTotal(res.total);

    // Usuarios únicos
    const uniqueUsers = Array.from(
      new Map(res.data.map((l: any) => [l.userId, l.user?.name])).entries()
    )
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    setUsers(uniqueUsers);
  };

  useEffect(() => {
    load();
  }, [
    params.page,
    params.limit,
    params.userId,
    params.action,
    params.module,
    params.search,
    params.from,
    params.to,
  ]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Obtener todos los registros filtrados para exportación
  const fetchAllFiltered = async () => {
    const res = await getAuditLogs({ ...params, page: 1, limit: 10000 });
    return res.data as any[];
  };

  const exportExcel = async () => {
    const data = await fetchAllFiltered();
    const rows = data.map((log) => ({
      Usuario: log.user?.name,
      Acción: log.action,
      Módulo: log.module,
      IP: log.ip || "",
      Fecha: new Date(log.createdAt).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
    XLSX.writeFile(wb, "auditoria.xlsx");
  };

  const exportCSV = async () => {
    const data = await fetchAllFiltered();
    const rows = data.map((log) => ({
      Usuario: log.user?.name,
      Accion: log.action,
      Modulo: log.module,
      IP: log.ip || "",
      Fecha: new Date(log.createdAt).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "auditoria.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const data = await fetchAllFiltered();
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Auditoría del Sistema", 14, 16);

    const body = data.map((log) => [
      log.user?.name || "",
      log.action,
      log.module,
      log.ip || "",
      new Date(log.createdAt).toLocaleString(),
    ]);

    autoTable(doc, {
      head: [["Usuario", "Acción", "Módulo", "IP", "Fecha"]],
      body,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 191, 165] },
      columnStyles: { 2: { cellWidth: 70 } },
    });

    doc.save("auditoria.pdf");
  };

  return (
    <Card sx={{ bgcolor: "#1c1c2e", color: "white", p: 3 }}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Auditoría del Sistema
        </Typography>

        {/* Filtros */}
        <Box
          sx={{
            mb: 2,
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 2,
          }}
        >
          <TextField
            label="Usuario"
            select
            value={filterUser}
            onChange={(e) => {
              setFilterUser(e.target.value);
              setPage(0);
            }}
            sx={{ bgcolor: "#2a2a40" }}
          >
            <MenuItem value="">Todos</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name} (ID {u.id})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Acción"
            select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(0);
            }}
            sx={{ bgcolor: "#2a2a40" }}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
          </TextField>

          <TextField
            label="Módulo"
            value={filterModule}
            onChange={(e) => {
              setFilterModule(e.target.value);
              setPage(0);
            }}
            sx={{ bgcolor: "#2a2a40" }}
          />

          <TextField
            label="Buscar"
            placeholder="usuario, ip, acción, módulo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ bgcolor: "#2a2a40" }}
          />

          <TextField
            label="Desde"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            sx={{ bgcolor: "#2a2a40" }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Hasta"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            sx={{ bgcolor: "#2a2a40" }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* Botones */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={load}
            sx={{ bgcolor: "#00bfa5", ":hover": { bgcolor: "#00d9b8" } }}
          >
            Buscar
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setFilterUser("");
              setFilterAction("");
              setFilterModule("");
              setSearch("");
              setFrom("");
              setTo("");
              setPage(0);
            }}
            sx={{ color: "#fff", borderColor: "#555" }}
          >
            Limpiar
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button variant="contained" onClick={exportExcel}>
            Exportar Excel
          </Button>
          <Button
            variant="outlined"
            onClick={exportCSV}
            sx={{ color: "#fff", borderColor: "#555" }}
          >
            Exportar CSV
          </Button>
          <Button
            variant="outlined"
            onClick={exportPDF}
            sx={{ color: "#fff", borderColor: "#555" }}
          >
            Exportar PDF
          </Button>
        </Stack>

        {/* Tabla */}
        <TableContainer component={Paper} sx={{ bgcolor: "#2a2a40" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#fff" }}>Usuario</TableCell>
                <TableCell sx={{ color: "#fff" }}>Acción</TableCell>
                <TableCell sx={{ color: "#fff" }}>Módulo</TableCell>
                <TableCell sx={{ color: "#fff" }}>IP</TableCell>
                <TableCell sx={{ color: "#fff" }}>Fecha</TableCell>
                <TableCell sx={{ color: "#fff", textAlign: "center" }}>
                  Detalle
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ color: "#ccc" }}>
                    {log.user?.name}
                  </TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{log.action}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{log.module}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>{log.ip}</TableCell>
                  <TableCell sx={{ color: "#ccc" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>

                  {/* ✅ Botón detalle mejorado */}
                  <TableCell sx={{ textAlign: "center" }}>
                    <IconButton
                      onClick={() => {
                        setSelectedLog(log);
                        setOpenDetail(true);
                      }}
                      size="small"
                      sx={{
                        color: "#00bfa5",
                        "&:hover": { color: "#00d9b8" },
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", p: 3 }}>
                    No hay registros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ color: "#fff" }}
        />

        {/* Modal */}
        <AuditDetailModal
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          log={selectedLog}
        />
      </CardContent>
    </Card>
  );
}
