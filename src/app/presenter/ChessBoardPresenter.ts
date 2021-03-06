import { ChessBoardView } from '../view/ChessBoardView';
import { Position } from './Position';
import { ChessModel, columns, Row, Square } from '../model';
import { SquareWasClicked } from '../view/events/SquareWasClicked';
import { MoveResult } from '../model/MoveResult';
import { PromotionChosenPiece } from '../view/events/PromotionChosenPiece';

export class ChessBoardPresenter {
  constructor(private readonly view: ChessBoardView, private readonly chessModel: ChessModel) {
    view.listenOn<SquareWasClicked>('SquareWasClicked', (event) => {
      this.onSquareWasClicked(event.position);
    });
    view.listenOn<PromotionChosenPiece>('PromotionChosenPiece', (event) => {
      this.onPromotionPieceWasClicked(event.chosenPiece);
    });
  }

  private lastPossibleMoves: string[] = [];
  private lastMoveAsPosition: Position = { x: 0, y: 0 };

  onPromotionPieceWasClicked(chosenPiece: string): void {
    const pawnWasPromoted = this.chessModel.pawnWasPromoted(chosenPiece);
    if (pawnWasPromoted) {
      this.view.afterPromotionPiece(
        this.translateSquareToAlgebraicNotation(pawnWasPromoted.onSquare),
        pawnWasPromoted.chosenPiece.name.toLowerCase(),
        pawnWasPromoted.chosenPiece.side,
      );
    }
  }

  onSquareWasClicked(position: Position): void {
    this.view.hideSelection();
    this.view.showSelectedPiece(this.translatePositionToAlgebraicNotation(position));
    this.view.hideAllAvailableMoves();
    const squaresStringArray = this.getPossibleMoves(position);
    this.view.showAvailableMoves(squaresStringArray);

    this.pieceMovement(position, squaresStringArray);
  }

  startGame(): void {
    this.view.showChessBoard(this.chessModel.squaresWithPiece);
  }

  private getPossibleMoves(position: Position): string[] {
    const square: Square = { column: columns[position.x - 1], row: position.y as Row };
    return this.chessModel.possibleMoves(square)?.map((square) => `${square.column.toLowerCase()}${square.row}`) ?? [];
  }

  private translatePositionToAlgebraicNotation(position: Position): string {
    const square: Square = { column: columns[position.x - 1], row: position.y as Row };
    return `${square.column.toLowerCase()}${square.row}`;
  }

  private translatePositionToSquareNotation(position: Position): Square {
    return { column: columns[position.x - 1], row: position.y as Row };
  }

  private translateSquareToAlgebraicNotation(square: Square): string {
    return `${square.column.toLowerCase()}${square.row}`;
  }

  private onEvents(events: MoveResult[]): void {
    events.forEach((event) => this.onEvent(event));
  }

  private onEvent(event: MoveResult) {
    switch (event.eventType) {
      case 'PieceWasCaptured':
        this.view.capturePiece(this.translateSquareToAlgebraicNotation(event.onSquare));
        break;
      case 'PieceWasMoved':
        this.view.movePiece(this.translateSquareToAlgebraicNotation(event.from), this.translateSquareToAlgebraicNotation(event.to));
        break;
      case 'PawnPromotionWasEnabled':
        this.view.pawnPromotion();
        break;
      // case 'PawnWasPromoted':
      //   this.view.afterPromotionPiece(
      //     this.translateSquareToAlgebraicNotation(event.onSquare),
      //     event.chosenPiece.name.toLowerCase(),
      //     event.chosenPiece.side,
      //   );
      //   break;
      default:
        break;
    }
  }

  private pieceMovement(position: Position, squaresStringArray: string[]) {
    if (this.lastPossibleMoves.includes(this.translatePositionToAlgebraicNotation(position))) {
      const moveEvents = this.chessModel.move(
        this.translatePositionToSquareNotation(this.lastMoveAsPosition),
        this.translatePositionToSquareNotation(position),
      );
      this.onEvents(moveEvents);
      this.view.hideSelection();
      this.view.hideAllAvailableMoves();
    }
    this.lastMoveAsPosition = position;
    this.lastPossibleMoves = squaresStringArray;
  }
}
