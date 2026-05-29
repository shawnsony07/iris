export class KalmanFilter {
  private r: number; // Measurement noise covariance
  private q: number; // Process noise covariance
  private p: number; // Estimation error covariance
  private x: number | null; // Estimated signal

  constructor(r = 10, q = 0.1) {
    this.r = r;
    this.q = q;
    this.p = 1;
    this.x = null;
  }

  filter(measurement: number) {
    if (this.x === null) {
      this.x = measurement;
      this.p = 1;
    } else {
      // Prediction
      this.p = this.p + this.q;
      
      // Update
      const k = this.p / (this.p + this.r); // Kalman Gain
      this.x = this.x + k * (measurement - this.x);
      this.p = (1 - k) * this.p;
    }
    return this.x;
  }
}

export class KalmanFilter2D {
  private filterX: KalmanFilter;
  private filterY: KalmanFilter;

  // R = Measurement Noise (higher = more smoothing, less responsive)
  // Q = Process Noise (higher = less smoothing, more responsive)
  constructor(r = 30, q = 0.05) {
    this.filterX = new KalmanFilter(r, q);
    this.filterY = new KalmanFilter(r, q);
  }

  update(x: number, y: number) {
    return {
      x: this.filterX.filter(x),
      y: this.filterY.filter(y)
    };
  }

  setParameters(r: number, q: number) {
    this.filterX = new KalmanFilter(r, q);
    this.filterY = new KalmanFilter(r, q);
  }
}
