// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface mínima do ERC20 para interagir com o token
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract ReferralDistributor {
    // Endereço do token ERC20 que será distribuído
    IERC20 public token;

    // Mapeamentos para registro de usuários e referenciadores
    mapping(address => bool) public registeredUsers;
    mapping(address => address) public referrers;
    mapping(address => address[]) public referrals; // Lista de referenciados por endereço

    // Recompensas
    uint256 public referralReward; // Quantidade de tokens para o referenciado
    uint256 public referrerReward; // Quantidade de tokens para o referenciador

    // Dono do contrato
    address public owner;

    // Eventos
    event Registered(address indexed user, address indexed referrer);
    event RewardsUpdated(uint256 newReferralReward, uint256 newReferrerReward);

    // Modificador para restringir funções ao dono
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Construtor
    constructor(address _tokenAddress, uint256 _referralReward, uint256 _referrerReward) {
        owner = msg.sender;
        token = IERC20(_tokenAddress);
        referralReward = _referralReward;
        referrerReward = _referrerReward;
    }
    // Função para retornar a lista de referenciados
    function getReferrals(address _referrer) public view returns (address[] memory) {
    return referrals[_referrer];
}

    // Função para registrar um usuário com um referenciador
   function registerUser(address _referrer) external {
    require(!registeredUsers[msg.sender], "User already registered");
    require(_referrer != address(0), "Invalid referrer address");
    require(_referrer != msg.sender, "Cannot refer yourself");

    registeredUsers[msg.sender] = true;
    referrers[msg.sender] = _referrer;
    referrals[_referrer].push(msg.sender); // Adiciona à lista de referenciados

    // Distribui tokens
    require(token.transfer(msg.sender, referralReward), "Transfer to referent failed");
    require(token.transfer(_referrer, referrerReward), "Transfer to referrer failed");

    emit Registered(msg.sender, _referrer);
}

    // Função para o dono registrar um usuário inicial
    function registerInitialUser(address _user) external onlyOwner {
        require(!registeredUsers[_user], "User already registered");
        registeredUsers[_user] = true;
    }

    // Função para o dono ajustar as recompensas
    function setRewards(uint256 _newReferralReward, uint256 _newReferrerReward) external onlyOwner {
        referralReward = _newReferralReward;
        referrerReward = _newReferrerReward;
        emit RewardsUpdated(_newReferralReward, _newReferrerReward);
    }

    // Função para depositar tokens no contrato
    function depositTokens(uint256 _amount) external {
        require(token.transferFrom(msg.sender, address(this), _amount), "Deposit failed");
    }

    // Função para o dono retirar tokens do contrato
    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(token.transfer(owner, _amount), "Withdrawal failed");
    }

    // Função para verificar o saldo de tokens no contrato
    function contractBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}