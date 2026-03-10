class NotificationService {
  async sendRideRequestNotification(driverId, requestData) {
    console.log(`Notification to driver ${driverId}:`, requestData);
  }

  async sendRideAcceptedNotification(passengerId, rideData) {
    console.log(`Notification to passenger ${passengerId}:`, rideData);
  }

  async sendRideRejectedNotification(passengerId, reason) {
    console.log(`Notification to passenger ${passengerId}: Ride rejected - ${reason}`);
  }
}

module.exports = new NotificationService();
