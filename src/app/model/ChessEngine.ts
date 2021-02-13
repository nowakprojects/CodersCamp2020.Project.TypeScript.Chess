import { ChessModel } from './ChessModel';
import { Row, Side, Square, SquareWithPiece } from './Types';
import { Pawn, Piece } from './pieces';
import { Player } from './Player';
import { Chessboard } from './Chessboard';
import { PieceWasMoved } from './PieceWasMoved';
import { PieceWasCaptured } from './PieceWasCaptured';
import { PawnPromotionWasEnabled } from './PawnPromotionWasEnabled';
import { isDefined } from './HelperFunctions';

export class ChessEngine implements ChessModel {
  private currentSide: Side = Side.WHITE;
  readonly squaresWithPiece: SquareWithPiece;

  constructor(private readonly board: Chessboard) {
    this.squaresWithPiece = board.squaresWithPiece;
  }

  move(byPlayer: Player, squareFrom: Square, squareTo: Square): (PieceWasMoved | PieceWasCaptured | PawnPromotionWasEnabled)[] {
    const chosenPiece = this.board.onPositionPiece(squareFrom);
    if (!chosenPiece) {
      throw new Error('There is no piece on this square.');
    }
    if (byPlayer.side !== this.currentSide) {
      throw new Error(`It's not Your turn.`);
    }
    if (byPlayer.side !== chosenPiece.side) {
      throw new Error('Player can not move other players pieces.');
    }
    if (!this.canMoveOnSquare(squareFrom, squareTo)) {
      throw new Error('Piece can not move to given square.');
    }

    const pieceWasMoved: PieceWasMoved = {
      eventType: 'PieceWasMoved',
      piece: chosenPiece,
      from: squareFrom,
      to: squareTo,
    };
    const pieceWasCaptured = this.pieceWasCaptured(squareTo, chosenPiece);

    const pawnPromotionWasEnabled = chosenPiece instanceof Pawn ? this.pawnPromotionWasEnabled(chosenPiece, squareTo) : undefined;
    this.onPieceWasMoved(pieceWasMoved);
    return [pieceWasMoved, pieceWasCaptured, pawnPromotionWasEnabled].filter(isDefined);
  }

  private pieceWasCaptured(squareTo: Square, chosenPiece: Piece): PieceWasCaptured | undefined {
    const pieceOnSquare = this.board.onPositionPiece(squareTo);
    return isDefined(pieceOnSquare) && pieceOnSquare.isOpponentOf(chosenPiece)
      ? {
          eventType: 'PieceWasCaptured',
          piece: pieceOnSquare,
          onSquare: squareTo,
        }
      : undefined;
  }

  private pawnPromotionWasEnabled(chosenPiece: Pawn, squareTo: Square): PawnPromotionWasEnabled | undefined {
    return (chosenPiece.side === Side.WHITE && squareTo.row === 8) || (chosenPiece.side === Side.BLACK && squareTo.row === 1)
      ? {
          eventType: 'PawnPromotionWasEnabled',
          onSquare: squareTo,
          pawn: chosenPiece,
        }
      : undefined;
  }

  private onPieceWasMoved(event: PieceWasMoved): void {
    this.board.movePiece(event.from, event.to);
    this.currentSide = this.changeTurn(event.piece.side);
  }

  private canMoveOnSquare(squareFrom: Square, squareTo: Square): boolean {
    const piecePossibleMoves = this.board.onPositionPiece(squareFrom)?.possibleMoves(squareFrom, this.board);
    return (
      piecePossibleMoves?.some((possibleMove) => possibleMove.column === squareTo.column && possibleMove.row === squareTo.row) ?? false
    );
  }

  private changeTurn(side: Side): Side {
    return side === Side.WHITE ? Side.BLACK : Side.WHITE;
  }

  private simulatedChessboardAfterMove(squareFrom: Square, squareTo: Square): Chessboard {
    const simulatedChessboard = new Chessboard({ ...this.board.squaresWithPiece });
    simulatedChessboard.movePiece(squareFrom, squareTo);
    return simulatedChessboard;
  }

  private kingPosition(chessboard: Chessboard, kingSide: Side): Square | undefined {
    const { squaresWithPiece: squaresWithPieces } = chessboard;
    const kingPositionKey = Object.keys(squaresWithPieces).find((key) => {
      const isKingName = squaresWithPieces[key].name === 'King';
      const isPlayerSide = squaresWithPieces[key].side === kingSide;
      return isKingName && isPlayerSide;
    });
    return kingPositionKey
      ? {
          column: kingPositionKey[0],
          row: Number(kingPositionKey[1]) as Row,
        }
      : undefined;
  }

  private isSquareChecked(chessboard: Chessboard, playerSide: Side, positionToControl: Square): boolean {
    const squaresWithPieces = chessboard.squaresWithPiece;
    return Object.keys(squaresWithPieces)
      .map((squareKey) => ({
        position: { column: squareKey[0], row: Number(squareKey[1]) as Row },
        piece: squaresWithPieces[squareKey],
      }))
      .filter(({ piece }) => piece.side !== playerSide)
      .map(({ position, piece }) => piece.possibleMoves(position, chessboard))
      .some((piecePossibleMoves) =>
        piecePossibleMoves.some((moveSquare) => moveSquare.column === positionToControl.column && moveSquare.row === positionToControl.row),
      );
  }

  private isKingChecked(chessboard: Chessboard, kingSide: Side): boolean {
    const kingPosition = this.kingPosition(chessboard, kingSide);
    return kingPosition ? this.isSquareChecked(chessboard, kingSide, kingPosition) : false;
  }

  private willBeKingChecked(squareFrom: Square, squareTo: Square): boolean {
    const simulatedChessboard = this.simulatedChessboardAfterMove(squareFrom, squareTo);
    return this.isKingChecked(simulatedChessboard, this.currentSide);
  }

  public pieceMovesNotCausingAllyKingCheckmate(position: Square): Square[] {
    const initialPossibleMoves = this.board.onPositionPiece(position)?.possibleMoves(position, this.board) ?? [];
    const filteringFunction = (onePossibleMove: Square) => !this.willBeKingChecked(position, onePossibleMove);
    return initialPossibleMoves.filter(filteringFunction);
  }

  public possibleMoves(position: Square): Square[] {
    return this.pieceMovesNotCausingAllyKingCheckmate(position);
  }
}
