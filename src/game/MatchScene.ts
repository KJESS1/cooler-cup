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

export class MatchScene extends Phaser.Scene {
  private cfg!: MatchConfig;
  private ball!: Phaser.GameObjects.Arc;
  private playersA: Phaser.GameObjects.Arc[] = [];
  private playersB: Phaser.GameObjects.Arc[] = [];
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
      this.playersA.push(
        this.add.circle(120 + Math.random() * 60, 130 + i * 95, 14, ca).setStrokeStyle(2, 0xffffff)
      );
      this.playersB.push(
        this.add.circle(620 + Math.random() * 60, 130 + i * 95, 14, cb).setStrokeStyle(2, 0xffffff)
      );
    }

    this.ball = this.add.circle(400, 300, 9, 0xffffff).setStrokeStyle(2, 0x333333);
    this.txt = this.add.text(340, 18, '0 - 0', { fontSize: '28px', color: '#fff', fontStyle: 'bold' });
    this.add.text(80, 18, this.cfg.teamA.name, { fontSize: '14px', color: '#fff' });
    this.add.text(620, 18, this.cfg.teamB.name, { fontSize: '14px', color: '#fff' });
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
      const d = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
      const speed = Math.abs(this.bvx) + Math.abs(this.bvy);
      if (d < 22 && speed < 1.5) {
        const isA = this.playersA.includes(p);
        const gx = isA ? 740 : 60;
        const angle = Math.atan2(
          300 - p.y + (Math.random() - 0.5) * 80,
          gx - p.x
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

  private moveTeam(team: Phaser.GameObjects.Arc[], speed: number) {
    let nearest = team[0];
    let nearestD = Infinity;
    team.forEach(p => {
      const d = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
      if (d < nearestD) { nearestD = d; nearest = p; }
    });
    if (nearestD > 8) {
      const a = Phaser.Math.Angle.Between(nearest.x, nearest.y, this.ball.x, this.ball.y);
      nearest.x += Math.cos(a) * speed;
      nearest.y += Math.sin(a) * speed;
      nearest.y = Phaser.Math.Clamp(nearest.y, 90, 510);
      nearest.x = Phaser.Math.Clamp(nearest.x, 62, 738);
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