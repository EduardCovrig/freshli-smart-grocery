package covrig.eduard.project.mappers;

import covrig.eduard.project.Models.User;
import covrig.eduard.project.dtos.user.UserRegistrationDTO;
import covrig.eduard.project.dtos.user.UserResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel="spring")
public interface UserMapper {

    UserResponseDTO toDto(User user);
    List<UserResponseDTO> toDtoList(List<User> users);

    //LOGICA DIN SPATE:
    //cauta campul id din clasa USER si ignora, nu-l mai cauta in UserRegistrationDTO
    //TARGET cauta in ce returneaza metoda, source se foloseste pt a cauta in obiectul parametrului.
    @Mapping(target="id",ignore=true)
    @Mapping(target="passwordHash",ignore=true) //Hashing-ul il facem in Service
    @Mapping(target="role",ignore=true) //setam default 'USER' in Service
    @Mapping(target="createdAt",ignore=true) //Timestamp-ul se seteaza in Service
    //ignorate astea care le-am pus doar ca sa ne ajute onetomany
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "interactions", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    User toEntity(UserRegistrationDTO dto);
}
