 import Phaser from 'phaser';

 export interface MatchResult {
   teamAScore: number;
   teamBScore: number;
   winner: 'A' | 'B' | 'draw';
 }

 export interface MatchConfig {
   teamA: { name: string; primaryColor: string };
   teamB: { name: string; primaryColor: string };
   durationMs: number;
   teamABias: number;
   onComplete: (result: MatchResult) => void;
 }

 interface PlayerEntity {
   container: Phaser.GameObjects.Container;
   body: Phaser.GameObjects.Arc;
 }

 export class MatchScene extends Phaser.Scene {
   private cfg!: MatchConfig;
   private ball!: Phaser.GameObjects.Arc;
   private playersA: PlayerEntity[] = [];
   private playersB: PlayerEntity[] = [];
   private scoreA = 0;
   private scoreB = 0;
   private elapsed = 0;
   private bvx = 0;
   private bvy = 0;
   private txt!: Phaser.GameObjects.Text;
   private done = false;

   constructor() { super('MatchScene'); }

   init(cfg: MatchConfig) {
     this.cfg = cfg;
     this.scoreA = 0;
     this.scoreB = 0;
     this.elapsed = 0;
     this.done = false;
     this.bvx = 0;
     this.bvy = 0;
     this.playersA = [];
     this.playersB = [];
   }

   create() {
     this.cameras.main.setBackgroundColor('#2d7a3a');
     this.add.rectangle(400, 300, 680, 440).setStrokeStyle(3, 0xffffff).setFillStyle(0x2d7a3a);
     this.add.line(400, 300, -340, 0, 340, 0, 0xffffff).setLineWidth(2);
     this.add.circle(400, 300, 50).setStrokeStyle(2, 0xffffff).setFillStyle(0x2d7a3a);
     this.add.rectangle(60, 300, 4, 120, 0xffffff);
     this.add.rectangle(740, 300, 4, 120, 0xffffff);

     const ca = Phaser.Display.Color.HexStringToColor(this.cfg.teamA.primaryColor).color;
     const cb = Phaser.Display.Color.HexStringToColor(this.cfg.teamB.primaryColor).color;

     for (let i = 0; i < 4; i++) {
       this.playersA.push(this.makePlayer(120 + Math.random() * 60, 130 + i * 95, ca));
       this.playersB.push(this.makePlayer(620 + Math.random() * 60, 130 + i * 95, cb));
     }

     this.ball = this.add.circle(400, 300, 9, 0xffffff).setStrokeStyle(2, 0x333333).setDepth(10);
     this.txt = this.add.text(340, 18, '0 - 0', { fontSize: '28px', color: '#fff', fontStyle: 'bold' });
     this.add.text(80, 18, this.cfg.teamA.name, { fontSize: '14px', color: '#fff' });
     this.add.text(620, 18, this.cfg.teamB.name, { fontSize: '14px', color: '#fff' });
   }

   private makePlayer(x: number, y: number, color: number): PlayerEntity {
     const container = this.add.container(x, y);

     const shadow = this.add.ellipse(0, 10, 18, 8, 0x000000, 0.25);
     const legL = this.add.rectangle(-4, 6, 4, 10, 0x1a1a1a);
     const legR = this.add.rectangle(4, 6, 4, 10, 0x1a1a1a);
     const body = this.add.circle(0, 0, 13, color).setStrokeStyle(2, 0xffffff);
     const head = this.add.circle(0, -12, 6, 0xf2c49b).setStrokeStyle(1, 0x000000);

     container.add([shadow, legL, legR, body, head]);
     container.setDepth(5);

     return { container, body };
   }

   update(_t: number, delta: number) {
     if (this.done) return;
     this.elapsed += delta;

     const bias = this.cfg.teamABias ?? 0.5;
     this.moveTeam(this.playersA, 1.5 + bias * 0.8);
     this.moveTeam(this.playersB, 1.5 + (1 - bias) * 0.8);

     this.ball.x += this.bvx;
     this.ball.y += this.bvy;
     this.bvx *= 0.97;
     this.bvy *= 0.97;

     if (this.ball.y < 90 || this.ball.y > 510) this.bvy *= -1;

     [...this.playersA, ...this.playersB].forEach(p => {
       const px = p.container.x;
       const py = p.container.y;
       const d = Phaser.Math.Distance.Between(px, py, this.ball.x, this.ball.y);
       const speed = Math.abs(this.bvx) + Math.abs(this.bvy);
       if (d < 22 && speed < 1.5) {
         const isA = this.playersA.includes(p);
         const gx = isA ? 740 : 60;
         const angle = Math.atan2(
           300 - py + (Math.random() - 0.5) * 80,
           gx - px
         );
         const power = 3.5 + Math.random() * 3;
         this.bvx = Math.cos(angle) * power;
         this.bvy = Math.sin(angle) * power;
       }
     });

     if (this.ball.x <= 62 && this.ball.y > 245 && this.ball.y < 355) {
       this.scoreB++;
       this.txt.setText(`${this.scoreA} - ${this.scoreB}`);
       this.resetBall();
     } else if (this.ball.x >= 738 && this.ball.y > 245 && this.ball.y < 355) {
       this.scoreA++;
       this.txt.setText(`${this.scoreA} - ${this.scoreB}`);
       this.resetBall();
     }

     if (this.elapsed >= this.cfg.durationMs) {
       this.done = true;
       const winner = this.scoreA > this.scoreB ? 'A' : this.scoreB > this.scoreA ? 'B' : 'draw';
       this.time.delayedCall(800, () =>
         this.cfg.onComplete({ teamAScore: this.scoreA, teamBScore: this.scoreB, winner })
       );
     }
   }

   private moveTeam(team: PlayerEntity[], speed: number) {
     let nearest = team[0];
     let nearestD = Infinity;
     team.forEach(p => {
       const d = Phaser.Math.Distance.Between(p.container.x, p.container.y, this.ball.x, this.ball.y);
       if (d < nearestD) { nearestD = d; nearest = p; }
     });
     if (nearestD > 8) {
       const a = Phaser.Math.Angle.Between(nearest.container.x, nearest.container.y, this.ball.x, this.ball.y);
       const newX = Phaser.Math.Clamp(nearest.container.x + Math.cos(a) * speed, 62, 738);
       const newY = Phaser.Math.Clamp(nearest.container.y + Math.sin(a) * speed, 90, 510);
       nearest.container.x = newX;
       nearest.container.y = newY;
       // flip facing direction based on movement
       nearest.container.scaleX = Math.cos(a) < 0 ? -1 : 1;
     }
   }

   private resetBall() {
     this.ball.x = 400;
     this.ball.y = 300;
     this.bvx = (Math.random() - 0.5) * 2;
     this.bvy = (Math.random() - 0.5) * 2;
   }
 }

 export function launchMatch(containerId: string, cfg: MatchConfig): Phaser.Game {
   const g = new Phaser.Game({
     type: Phaser.AUTO,
     width: 800,
     height: 560,
     parent: containerId,
     backgroundColor: '#2d7a3a',
     scene: MatchScene,
   });
   g.events.once('ready', () => g.scene.start('MatchScene', cfg));
   return g;
 }