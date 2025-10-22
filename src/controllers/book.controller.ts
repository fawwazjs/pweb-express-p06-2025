import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ CREATE
export const createBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      writer,
      publisher,
      publication_year,
      description,
      price,
      stock_quantity,
      genre_id,
    } = req.body as any;

    if (!title || !writer || !price || !stock_quantity || !genre_id) {
      res.status(400).json({ message: "Semua field wajib diisi" });
      return;
    }

    const exist = await prisma.book.findFirst({ where: { title } });
    if (exist) {
      res.status(409).json({ message: "Judul buku sudah ada" });
      return;
    }

    const book = await prisma.book.create({
      data: {
        title,
        writer,
        publisher,
        publication_year: publication_year ? Number(publication_year) : null,
        description,
        price: Number(price),
        stock_quantity: Number(stock_quantity),
        genre_id,
      },
      include: { genre: true },
    });

    res.status(201).json({ message: "Buku berhasil dibuat", data: book });
  } catch (err) {
    res.status(500).json({ message: "Gagal membuat buku", error: err });
  }
};

// ✅ READ (GET ALL)
export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const title = req.query.title as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const books = await prisma.book.findMany({
      where: title ? { title: { contains: title } } : {},
      skip,
      take: limit,
      include: { genre: true },
      orderBy: { created_at: "desc" },
    });

    res.json({ data: books });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil daftar buku", error: err });
  }
};

// ✅ READ (GET DETAIL)
export const getBookDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { book_id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id: book_id },
      include: { genre: true },
    });

    if (!book) {
      res.status(404).json({ message: "Buku tidak ditemukan" });
      return;
    }

    res.json({ data: book });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil detail buku", error: err });
  }
};

// ✅ UPDATE
export const updateBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { book_id } = req.params;
    const data = req.body;

    const updated = await prisma.book.update({ where: { id: book_id }, data });
    res.json({ message: "Buku berhasil diupdate", data: updated });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Buku tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Gagal update buku", error: err });
  }
};

// ✅ DELETE
export const deleteBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { book_id } = req.params;
    await prisma.book.delete({ where: { id: book_id } });
    res.json({ message: "Buku dihapus" });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ message: "Buku tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Gagal hapus buku", error: err });
  }
};
