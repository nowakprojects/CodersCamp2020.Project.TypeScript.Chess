import { ChessEngine } from '../../../src/app/model';
import { Side, Square, SquareWithPiece } from '../../../src/app/model';
import { Chessboard } from '../../../src/app/model';
import { Pawn } from '../../../src/app/model';
import 'jest-extended';
import { Queen } from '../../../src/app/model';
import { Knight } from '../../../src/app/model';

describe('Chess Engine', () => {
  it('Given white piece on A2 and black piece on A4, when move white piece from A2 to A3, then white piece was moved from A2 to A3', () => {
    const whitePiece = new Pawn(Side.WHITE);
    const blackPiece = new Pawn(Side.BLACK);
    const boardWithPieces: SquareWithPiece = { A2: whitePiece, A4: blackPiece };
    const chessBoard = new Chessboard(boardWithPieces);
    const engine = new ChessEngine(chessBoard);
    const squareFrom: Square = { column: 'A', row: 2 };
    const squareTo: Square = { column: 'A', row: 3 };

    expect(engine.move(squareFrom, squareTo)).toIncludeSameMembers([
      {
        eventType: 'PieceWasMoved',
        piece: whitePiece,
        from: squareFrom,
        to: squareTo,
      },
    ]);
  });

  it('Given white piece on A2 and black piece on A4, when move white piece from A2 to A4, then white piece was moved from A2 to A4 and piece from A4 was captured', () => {
    const whitePiece = new Queen(Side.WHITE);
    const blackPiece = new Pawn(Side.BLACK);
    const boardWithPieces: SquareWithPiece = { A2: whitePiece, A4: blackPiece };
    const chessBoard = new Chessboard(boardWithPieces);
    const engine = new ChessEngine(chessBoard);
    const squareFrom: Square = { column: 'A', row: 2 };
    const squareTo: Square = { column: 'A', row: 4 };

    expect(engine.move(squareFrom, squareTo)).toIncludeSameMembers([
      { eventType: 'PieceWasCaptured', piece: blackPiece, onSquare: squareTo },
      { eventType: 'PieceWasMoved', piece: whitePiece, from: squareFrom, to: squareTo },
    ]);
  });

  it('Given white pieces on C2 and B1 and black piece on B4, when move white piece to C3, then black piece attacks on C3 and then another white piece attacks on C3', () => {
    const whitePawn = new Pawn(Side.WHITE);
    const whiteKnight = new Knight(Side.WHITE);
    const blackPawn = new Pawn(Side.BLACK);
    const boardWithPieces: SquareWithPiece = { C2: whitePawn, B1: whiteKnight, B4: blackPawn };
    const chessBoard = new Chessboard(boardWithPieces);
    const engine = new ChessEngine(chessBoard);

    engine.move({ column: 'C', row: 2 }, { column: 'C', row: 3 });
    engine.move({ column: 'B', row: 4 }, { column: 'C', row: 3 });
    expect(engine.move({ column: 'B', row: 1 }, { column: 'C', row: 3 })).toIncludeSameMembers([
      { eventType: 'PieceWasCaptured', piece: blackPawn, onSquare: { column: 'C', row: 3 } },
      { eventType: 'PieceWasMoved', piece: whiteKnight, from: { column: 'B', row: 1 }, to: { column: 'C', row: 3 } },
    ]);
  });

  it('Should throw an Error if player wants to move opponents piece', () => {
    const whitePiece = new Queen(Side.WHITE);
    const blackPiece = new Pawn(Side.BLACK);
    const boardWithPieces: SquareWithPiece = { A2: blackPiece, A4: whitePiece };
    const chessBoard = new Chessboard(boardWithPieces);
    const engine = new ChessEngine(chessBoard);
    const squareFrom: Square = { column: 'A', row: 2 };
    const squareTo: Square = { column: 'A', row: 4 };

    expect(() => engine.move(squareFrom, squareTo)).toThrowError("It's not Your turn.");
  });

  it('Should throw an Error if player wants to move piece to not available square', () => {
    const whitePiece = new Pawn(Side.WHITE);
    const boardWithPieces: SquareWithPiece = { A2: whitePiece };
    const chessBoard = new Chessboard(boardWithPieces);
    const engine = new ChessEngine(chessBoard);
    const squareFrom: Square = { column: 'A', row: 2 };
    const squareTo: Square = { column: 'A', row: 5 };

    expect(() => engine.move(squareFrom, squareTo)).toThrowError('Piece can not move to given square.');
  });

  it('Should throw an Error if player wants to move twice', () => {
    const whitePiece = new Pawn(Side.WHITE);
    const boardWithPieces: SquareWithPiece = { A2: whitePiece };
    const chessBoard = new Chessboard(boardWithPieces);
    const engine = new ChessEngine(chessBoard);
    const squareStart: Square = { column: 'A', row: 2 };
    const squareMiddle: Square = { column: 'A', row: 3 };
    const squareFinish: Square = { column: 'A', row: 4 };

    engine.move(squareStart, squareMiddle);

    expect(() => engine.move(squareMiddle, squareFinish)).toThrowError(`It's not Your turn.`);
  });

  it('Should throw an Error if player wants to move piece that was just captured', () => {
    const whitePiece = new Queen(Side.WHITE);
    const blackPiece = new Pawn(Side.BLACK);
    const boardWithPieces: SquareWithPiece = { A2: whitePiece, A6: blackPiece };
    const chessBoard = new Chessboard(boardWithPieces);
    const engine = new ChessEngine(chessBoard);

    engine.move({ column: 'A', row: 2 }, { column: 'A', row: 6 });

    expect(() => engine.move({ column: 'A', row: 6 }, { column: 'A', row: 5 })).toThrowError("It's not Your turn.");
  });

  it('Should throw an Error if chosen square is not occupied', () => {
    const boardWithPieces: SquareWithPiece = {};
    const chessBoard = new Chessboard(boardWithPieces);
    const engine = new ChessEngine(chessBoard);

    expect(() => engine.move({ column: 'A', row: 2 }, { column: 'A', row: 6 })).toThrowError('There is no piece on this square.');
  });
});
