import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ CREATE
export const createGenre = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: "Nama genre wajib diisi" });
      return;
    }

    const exist = await prisma.genre.findFirst({ where: { name } });
    if (exist) {
      res.status(409).json({ message: "Genre sudah ada" });
      return;
    }

    const genre = await prisma.genre.create({ data: { name } });
    res.status(201).json({ message: "Genre berhasil dibuat", data: genre });
  } catch (err) {
    res.status(500).json({ message: "Gagal membuat genre", error: err });
  }
};

// ✅ READ (GET ALL)
export const getGenres = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const genres = await prisma.genre.findMany({
      include: { books: true },
      orderBy: { name: "asc" },
    });
    res.json({ data: genres });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil daftar genre", error: err });
  }
};

// ✅ UPDATE
export const updateGenre = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { genre_id } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: "Nama genre wajib diisi" });
      return;
    }

    const updated = await prisma.genre.update({
      where: { id: genre_id },
      data: { name },
    });

    res.json({ message: "Genre berhasil diupdate", data: updated });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Genre tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Gagal update genre", error: err });
  }
};

// ✅ DELETE
export const deleteGenre = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { genre_id } = req.params;
    await prisma.genre.delete({ where: { id: genre_id } });
    res.json({ message: "Genre dihapus" });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Genre tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Gagal hapus genre", error: err });
  }
};
